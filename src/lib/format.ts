export const formatNaira = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
export const formatLitres = (value: number) => `${new Intl.NumberFormat('en-NG').format(value)} L`;
export const initials = (value: string) => value.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'DU';
