export interface PaymentMethodInfo {
  paymentMethod?: string | null;
  bankName?: string | null;
  paymentProvider?: string | null;
}

export function formatPaymentMethod(
  info?: PaymentMethodInfo | null,
  translateFn?: (key: string) => string
): string {
  if (!info) return '';

  const t = (key: string, fallback: string) => {
    if (!translateFn) return fallback;
    const val = translateFn(key);
    return val && val !== key ? val : fallback;
  };

  const pm = (info.paymentMethod || '').trim();
  const bank = (info.bankName || '').trim();
  const provider = (info.paymentProvider || '').trim().toLowerCase();

  // Telebirr
  if (
    pm.toLowerCase() === 'telebirr' ||
    provider === 'telebirr' ||
    bank.toLowerCase() === 'telebirr'
  ) {
    return t('salesHistory.telebirr', 'Telebirr');
  }

  // Cash
  if (pm.toLowerCase() === 'cash') {
    return t('salesHistory.cash', 'Cash');
  }

  // Card
  if (pm.toLowerCase() === 'card') {
    return t('salesHistory.card', 'Card');
  }

  // Mobile Banking / Mobile Payment
  if (
    pm.toLowerCase().startsWith('mobile banking') ||
    pm.toLowerCase() === 'mobile payment'
  ) {
    // Check if bank name is embedded in parentheses e.g. "Mobile Banking (CBE)"
    const match = pm.match(/Mobile Banking\s*\(([^)]+)\)/i);
    const effectiveBank = match ? match[1].trim() : bank;
    const baseLabel = t('salesHistory.mobileBanking', 'Mobile Banking');

    if (effectiveBank) {
      return `${baseLabel} (${effectiveBank})`;
    }
    return baseLabel;
  }

  // Fallback: If bank is known and not already in string, append it
  if (bank && !pm.toLowerCase().includes(bank.toLowerCase())) {
    return `${pm} (${bank})`;
  }

  return pm || t('salesHistory.cash', 'Cash');
}

export function getPaymentMethodBadgeClass(info?: PaymentMethodInfo | null): string {
  if (!info) return 'badge--cash';

  const pm = (info.paymentMethod || '').trim().toLowerCase();
  const bank = (info.bankName || '').trim().toLowerCase();
  const provider = (info.paymentProvider || '').trim().toLowerCase();

  if (pm === 'telebirr' || provider === 'telebirr' || bank === 'telebirr') {
    return 'badge--telebirr';
  }
  if (pm.startsWith('mobile banking') || pm === 'mobile payment' || bank) {
    return 'badge--mobile-banking';
  }
  if (pm === 'card') {
    return 'badge--card';
  }
  return 'badge--cash';
}

export function getPaymentMethodIcon(info?: PaymentMethodInfo | null): string {
  if (!info) return 'payments';

  const pm = (info.paymentMethod || '').trim().toLowerCase();
  const bank = (info.bankName || '').trim().toLowerCase();
  const provider = (info.paymentProvider || '').trim().toLowerCase();

  if (pm === 'telebirr' || provider === 'telebirr' || bank === 'telebirr') {
    return 'phone_android';
  }
  if (pm.startsWith('mobile banking') || pm === 'mobile payment' || bank) {
    return 'account_balance';
  }
  if (pm === 'card') {
    return 'credit_card';
  }
  return 'payments';
}
