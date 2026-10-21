import { Injectable } from '@angular/core';
import { Html5Qrcode } from 'html5-qrcode';
import { ExtractedReceiptDetails } from '../../models/payment-verification.model';

export const ALLOWED_BANK_DOMAINS = [
  'cbe.com.et',
  'mbreciept.cbe.com.et',
  'mb.cbe.com.et',
  'apps.cbe.com.et',
  'ethiotelecom.et',
  'transactioninfo.ethiotelecom.et',
  'bankofabyssinia.com',
  'awashbank.com',
  'ebirr.com',
  'zamzambank.com.et',
  'zemenbank.com',
  'cheki.et'
];

export const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable({
  providedIn: 'root'
})
export class ReceiptScannerService {
  /**
   * Validate uploaded receipt image format and file size.
   */
  validateReceiptImage(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No receipt file was selected.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file format (${file.type || 'unknown'}). Please upload a JPEG, PNG, or WebP receipt image.`
      };
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Receipt image is too large (${sizeMb} MB). Maximum allowed size is 5 MB.`
      };
    }

    return { valid: true };
  }

  /**
   * Decodes an embedded QR code from an uploaded receipt image file locally using Html5Qrcode.
   */
  async decodeReceiptImage(file: File): Promise<string> {
    const validation = this.validateReceiptImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const tempElementId = 'receipt-qr-temp-decode-node';
    let tempElement = document.getElementById(tempElementId);
    let createdTempElement = false;

    if (!tempElement) {
      tempElement = document.createElement('div');
      tempElement.id = tempElementId;
      tempElement.style.display = 'none';
      document.body.appendChild(tempElement);
      createdTempElement = true;
    }

    const html5QrCode = new Html5Qrcode(tempElementId);

    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      return decodedText.trim();
    } catch (err: any) {
      const errMsg = String(err?.message || err || '');
      if (errMsg.toLowerCase().includes('no qr code') || errMsg.toLowerCase().includes('not found') || !errMsg) {
        throw new Error(
          'No readable QR code found in this receipt image. Standard QR decoding cannot read printed or handwritten text without OCR. Please enter the transaction reference manually.'
        );
      }
      throw new Error(`Failed to decode receipt image: ${errMsg}`);
    } finally {
      try {
        await html5QrCode.clear();
      } catch {
        // Ignore cleanup error
      }
      if (createdTempElement && tempElement?.parentNode) {
        tempElement.parentNode.removeChild(tempElement);
      }
    }
  }

  /**
   * Parses decoded QR text safely into structured transaction details.
   */
  parseQrData(raw: string): ExtractedReceiptDetails {
    if (!raw || !raw.trim()) {
      return {
        rawContent: '',
        parseErrors: ['Scanned QR content was empty.']
      };
    }

    const trimmed = raw.trim();
    const result: ExtractedReceiptDetails = {
      rawContent: trimmed,
      parseWarnings: [],
      parseErrors: []
    };

    // 1. Check for payment request / merchant payment instructions (e.g. upi://, telebirr://pay, static merchant QRs)
    if (this.isMerchantPaymentRequest(trimmed)) {
      result.isPaymentRequestOnly = true;
      result.parseWarnings?.push(
        'This QR code is a merchant payment request or transfer instruction, not proof of a completed payment. Please ask the customer for their completed payment receipt or reference SMS.'
      );
      return result;
    }

    // 2. Try JSON parsing
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        this.populateFromJson(parsed, result);
        return result;
      } catch {
        // Not valid JSON, continue with URL or string parsing
      }
    }

    // 3. Try URL parsing
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      this.populateFromUrl(trimmed, result);
      return result;
    }

    // 4. Try Key-Value line parsing (e.g., "Ref: FT...", "Amount: 1200")
    if (trimmed.includes(':') || trimmed.includes('=')) {
      this.populateFromKeyValueLines(trimmed, result);
      if (result.transactionReference) {
        return result;
      }
    }

    // 5. Try plain transaction reference identification
    this.populateFromPlainText(trimmed, result);

    return result;
  }

  /**
   * Start camera scanning on a given DOM element ID.
   */
  async startCamera(
    elementId: string,
    onSuccess: (decodedText: string) => void,
    onError?: (error: any) => void
  ): Promise<Html5Qrcode> {
    const scanner = new Html5Qrcode(elementId);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    try {
      // Prefer rear camera on mobile devices
      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onSuccess(decodedText);
        },
        (errorMessage) => {
          // Continuous frame-by-frame scan misses are normal, don't bubble to onError unless needed
        }
      );
    } catch (err: any) {
      // If environment facingMode fails (e.g., desktop webcam without rear camera flag), fallback to any camera
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const deviceId = devices[0].id;
          await scanner.start(
            deviceId,
            config,
            (decodedText) => onSuccess(decodedText),
            () => {}
          );
        } else {
          throw new Error('No camera detected on this device.');
        }
      } catch (fallbackErr: any) {
        await this.stopCamera(scanner);
        const name = fallbackErr?.name || err?.name;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          throw new Error('Camera access was denied. Please allow camera permissions in your browser settings or enter the reference manually.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          throw new Error('No camera found on this device.');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          throw new Error('Camera is currently in use by another application or tab.');
        }
        throw new Error(fallbackErr?.message || err?.message || 'Unable to start camera.');
      }
    }

    return scanner;
  }

  /**
   * Safely stops the camera and cleans up video tracks and DOM container.
   */
  async stopCamera(scanner: Html5Qrcode | null): Promise<void> {
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      // Ignore cleanup error
    }
  }

  private isMerchantPaymentRequest(text: string): boolean {
    const lower = text.toLowerCase();
    if (lower.startsWith('upi://') || lower.startsWith('telebirr://pay') || lower.startsWith('cbebirr://pay')) {
      return true;
    }

    // Check if it's a URL having payment request indicators without a completed receipt reference
    if (lower.includes('merchantid=') || lower.includes('tillnumber=') || lower.includes('payee=')) {
      if (!lower.includes('ref=') && !lower.includes('tid=') && !lower.includes('transid=')) {
        return true;
      }
    }

    return false;
  }

  private populateFromUrl(urlStr: string, result: ExtractedReceiptDetails): void {
    result.receiptUrl = urlStr;

    try {
      const url = new URL(urlStr);
      const host = url.hostname.toLowerCase();

      // Check against allowed bank domains
      const isAllowedDomain = ALLOWED_BANK_DOMAINS.some(
        (domain) => host === domain || host.endsWith('.' + domain)
      );

      if (!isAllowedDomain) {
        result.parseWarnings?.push(
          `The scanned URL host '${host}' is not a recognized Ethiopian banking domain. Please review before proceeding.`
        );
      }

      // Determine provider from host
      if (host.includes('cbe')) {
        result.provider = 'cbe';
        result.providerName = 'Commercial Bank of Ethiopia';
      } else if (host.includes('ethiotelecom')) {
        result.provider = 'telebirr';
        result.providerName = 'Telebirr';
      } else if (host.includes('abyssinia')) {
        result.provider = 'boa';
        result.providerName = 'Bank of Abyssinia';
      } else if (host.includes('awash')) {
        result.provider = 'awash';
        result.providerName = 'Awash Bank';
      }

      // Extract transaction reference from query parameters (case-insensitive)
      const getParam = (name: string): string | null => {
        const target = name.toLowerCase();
        for (const [k, v] of url.searchParams.entries()) {
          if (k.toLowerCase() === target) return v;
        }
        return null;
      };

      const refKeys = ['ref', 'tid', 'id', 'transid', 'transactionid', 'reference', 'receiptno', 'code'];
      for (const k of refKeys) {
        const val = getParam(k);
        if (val && val.trim()) {
          result.transactionReference = val.trim().toUpperCase();
          break;
        }
      }

      // Fallback: extract last path segment if reference wasn't in query params
      if (!result.transactionReference) {
        const segments = url.pathname.split('/').filter((s) => Boolean(s));
        if (segments.length > 0) {
          const last = segments[segments.length - 1].trim();
          if (last.length >= 4 && !last.includes('.')) {
            result.transactionReference = decodeURIComponent(last).toUpperCase();
          }
        }
      }

      // Amount
      const amountVal = getParam('amount') || getParam('amt') || getParam('total');
      if (amountVal) {
        const num = parseFloat(amountVal.replace(/,/g, ''));
        if (!isNaN(num) && num > 0) {
          result.amount = num;
          result.currency = 'ETB';
        }
      }

      // Date
      const dateVal = getParam('date') || getParam('time') || getParam('txndate');
      if (dateVal) {
        result.transactionDate = dateVal;
      }

      // Payer / Receiver
      const payerVal = getParam('payer') || getParam('sender') || getParam('payerphone') || getParam('phone');
      if (payerVal) {
        if (/^\+?\d{9,13}$/.test(payerVal.replace(/\s+/g, ''))) {
          result.payerPhone = payerVal;
        } else {
          result.payerName = payerVal;
        }
      }

      const receiverAcc = getParam('acc') || getParam('receiver') || getParam('to') || getParam('receiveraccount');
      if (receiverAcc) {
        result.receiverAccountMasked = this.maskAccount(receiverAcc);
      }
    } catch {
      result.parseErrors?.push('Failed to parse receipt URL structure.');
    }
  }

  private populateFromJson(json: any, result: ExtractedReceiptDetails): void {
    if (typeof json !== 'object' || json === null) return;

    // Reference
    const ref = json.ref || json.reference || json.transactionId || json.txId || json.id || json.transId || json.receiptNumber;
    if (ref && typeof ref === 'string') {
      result.transactionReference = ref.trim().toUpperCase();
    }

    // Provider / Bank
    const bank = json.bank || json.provider || json.bankCode;
    if (bank && typeof bank === 'string') {
      result.provider = bank.toLowerCase();
      result.providerName = this.getProviderDisplayName(bank);
    }

    // Amount
    const amt = json.amount || json.amt || json.total;
    if (amt !== undefined) {
      const num = typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        result.amount = num;
        result.currency = json.currency || 'ETB';
      }
    }

    // Phone / Payer
    const phone = json.payerPhone || json.phone || json.senderPhone || json.mobile;
    if (phone && typeof phone === 'string') {
      result.payerPhone = phone.trim();
    }

    const payer = json.payer || json.payerName || json.sender;
    if (payer && typeof payer === 'string') {
      result.payerName = payer.trim();
    }

    // Masked accounts
    const payerAcc = json.payerAccount || json.fromAccount || json.account;
    if (payerAcc && typeof payerAcc === 'string') {
      result.payerAccountMasked = this.maskAccount(payerAcc);
    }

    const receiverAcc = json.receiverAccount || json.toAccount || json.destination;
    if (receiverAcc && typeof receiverAcc === 'string') {
      result.receiverAccountMasked = this.maskAccount(receiverAcc);
    }

    // Date
    const dt = json.date || json.timestamp || json.transactionDate;
    if (dt && typeof dt === 'string') {
      result.transactionDate = dt.trim();
    }
  }

  private populateFromKeyValueLines(text: string, result: ExtractedReceiptDetails): void {
    const lines = text.split(/[\r\n]+/);
    for (const line of lines) {
      const separatorIdx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('=');
      if (separatorIdx === -1) continue;

      const key = line.substring(0, separatorIdx).trim().toLowerCase();
      const val = line.substring(separatorIdx + 1).trim();

      if (!val) continue;

      // Check provider first to prevent 'provider' matching 'id'
      if (key === 'bank' || key === 'provider' || key.includes('bank') || key.includes('provider')) {
        result.provider = val.toLowerCase();
        result.providerName = this.getProviderDisplayName(val);
      } else if (
        key === 'ref' ||
        key === 'reference' ||
        key === 'txid' ||
        key === 'txn_id' ||
        key === 'id' ||
        key === 'code' ||
        key.startsWith('ref') ||
        key.startsWith('txn') ||
        key.includes('trans')
      ) {
        result.transactionReference = val.toUpperCase();
      } else if (key.includes('amount') || key.includes('total') || key.includes('paid')) {
        const match = val.match(/([0-9,.]+)/);
        if (match) {
          const num = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(num) && num > 0) {
            result.amount = num;
            result.currency = 'ETB';
          }
        }
      } else if (key.includes('phone') || key.includes('payer') || key.includes('mobile')) {
        if (/^\+?\d{9,13}$/.test(val.replace(/\s+/g, ''))) {
          result.payerPhone = val;
        } else {
          result.payerName = val;
        }
      } else if (key.includes('date') || key.includes('time')) {
        result.transactionDate = val;
      }
    }
  }

  private populateFromPlainText(text: string, result: ExtractedReceiptDetails): void {
    // CBE pattern: FT24...
    const cbeMatch = text.match(/\b(FT[0-9A-Z]{8,22})\b/i);
    if (cbeMatch) {
      result.transactionReference = cbeMatch[1].toUpperCase();
      result.provider = 'cbe';
      result.providerName = 'Commercial Bank of Ethiopia';
      return;
    }

    // Telebirr pattern: CL...
    const telebirrMatch = text.match(/\b(CL[0-9A-Z]{8,22})\b/i);
    if (telebirrMatch) {
      result.transactionReference = telebirrMatch[1].toUpperCase();
      result.provider = 'telebirr';
      result.providerName = 'Telebirr';
      return;
    }

    // Alphanumeric reference code token (6 to 35 chars)
    if (/^[A-Za-z0-9_-]{6,35}$/.test(text)) {
      result.transactionReference = text.toUpperCase();
    } else {
      result.parseWarnings?.push(
        'Decoded QR does not match standard Ethiopian receipt formats. Please review or enter the reference manually.'
      );
    }
  }

  private maskAccount(account: string): string {
    const cleaned = account.trim();
    if (!cleaned || cleaned.includes('*')) return cleaned;
    if (cleaned.length <= 4) return '****';
    return `${cleaned.substring(0, 1)}****${cleaned.substring(cleaned.length - 4)}`;
  }

  private getProviderDisplayName(codeOrName: string): string {
    const lower = codeOrName.toLowerCase();
    if (lower.includes('cbe')) return 'Commercial Bank of Ethiopia';
    if (lower.includes('telebirr')) return 'Telebirr';
    if (lower.includes('boa') || lower.includes('abyssinia')) return 'Bank of Abyssinia';
    if (lower.includes('awash')) return 'Awash Bank';
    return codeOrName;
  }
}
