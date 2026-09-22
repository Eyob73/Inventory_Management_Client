import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-scanner-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  templateUrl: './barcode-scanner-dialog.html',
  styleUrl: './barcode-scanner-dialog.scss',
})
export class BarcodeScannerDialog implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<BarcodeScannerDialog>);
  private translocoService = inject(TranslocoService);
  
  errorMessage = signal<string | null>(null);
  
  private html5QrCode: Html5Qrcode | null = null;
  private isProcessing = false;
  private isDestroyed = false;

  ngOnInit() {
    this.initScanner();
  }

  async initScanner() {
    try {
      const hasCamera = await Html5Qrcode.getCameras();
      if (!hasCamera || hasCamera.length === 0) {
        this.errorMessage.set(this.translocoService.translate('scanner.cameraUnavailable') || 'No camera found on this device.');
        return;
      }

      this.html5QrCode = new Html5Qrcode('reader');
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF
        ]
      };

      if (this.isDestroyed) return;

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText: string) => {
          this.handleBarcode(decodedText);
        },
        (errorMessage: string) => {
          // Ignore frequent parsing errors during video stream
        }
      );
    } catch (err: any) {
      if (this.isDestroyed) return;
      console.error('Camera initialization failed', err);
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        this.errorMessage.set(this.translocoService.translate('scanner.cameraPermissionDenied') || 'Camera access is required. Please allow it in your browser settings.');
      } else {
        this.errorMessage.set(this.translocoService.translate('scanner.cameraInUse') || 'Camera unavailable or already in use.');
      }
    }
  }

  handleBarcode(barcode: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;
    
    // Stop the scanner immediately upon successful scan
    if (this.html5QrCode && this.html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
      this.html5QrCode.stop().then(() => {
        this.dialogRef.close(barcode);
      }).catch(err => {
        console.error('Failed to stop camera on success', err);
        this.dialogRef.close(barcode);
      });
    } else {
      this.dialogRef.close(barcode);
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    if (this.html5QrCode) {
      try {
        if (this.html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
          this.html5QrCode.stop().catch(console.error);
        }
      } catch (e) {
        console.error('Error cleaning up scanner', e);
      }
    }
  }
}
