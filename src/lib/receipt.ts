import type { DeliveryMode, Order, PaymentMethod } from '@/types/domain';
import { formatLitres, formatNaira } from './format';

const deliveryLabels: Record<DeliveryMode, string> = {
  quick: 'Quick delivery',
  emergency: 'Emergency delivery',
  scheduled: 'Scheduled delivery'
};

const paymentLabels: Record<PaymentMethod, string> = {
  paystack: 'Paystack',
  wallet: 'DieselUp wallet',
  bank_transfer: 'Manual bank transfer'
};

const escapeHtml = (value: string | number | null | undefined) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const timestampToDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  return null;
};

export const receiptRows = (order: Order) => [
  { label: `${formatLitres(order.quantityLitres)} diesel`, value: formatNaira(order.money.fuelCost) },
  { label: order.isEmergency ? 'Priority delivery' : 'Delivery', value: formatNaira(order.money.deliveryFee) },
  { label: 'Tax', value: formatNaira(order.money.tax) }
];

export const buildReceiptHtml = (order: Order) => {
  const createdAt = timestampToDate(order.createdAt);
  const scheduledFor = timestampToDate(order.scheduledFor);
  const estimatedArrival = timestampToDate(order.estimatedArrival);
  const deliveryMode = order.deliveryMode ?? (order.isEmergency ? 'emergency' : order.scheduledFor ? 'scheduled' : 'quick');
  const rows = receiptRows(order).map((row) => `
    <tr>
      <td>${escapeHtml(row.label)}</td>
      <td>${escapeHtml(row.value)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>DieselUp Receipt ${escapeHtml(order.orderNumber)}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
        .page { width: 794px; min-height: 1123px; margin: 0 auto; padding: 44px; background: #ffffff; }
        .brand { display: flex; align-items: center; justify-content: space-between; margin-bottom: 34px; }
        .logo { display: flex; align-items: center; gap: 14px; }
        .mark { width: 52px; height: 52px; border-radius: 18px; background: linear-gradient(135deg, #ff8a00, #f59e0b); display: grid; place-items: center; color: white; font-size: 26px; font-weight: 900; }
        .brand h1 { margin: 0; font-size: 28px; line-height: 1; }
        .brand p, .muted { color: #64748b; margin: 4px 0 0; }
        .badge { display: inline-block; padding: 8px 13px; border-radius: 999px; background: #fff7ed; color: #ff8a00; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
        .hero { border-radius: 28px; background: #0f172a; color: white; padding: 30px; margin-bottom: 26px; position: relative; overflow: hidden; }
        .hero::after { content: ""; position: absolute; right: -70px; top: -70px; width: 210px; height: 210px; border-radius: 105px; background: rgba(255,138,0,.18); }
        .hero .label { color: #cbd5e1; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .hero .number { font-size: 32px; font-weight: 900; margin: 8px 0 18px; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .hero-grid strong { display: block; font-size: 17px; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 22px; }
        .card { border: 1px solid #e2e8f0; border-radius: 22px; padding: 22px; }
        h2 { margin: 0 0 15px; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        td { padding: 14px 0; border-bottom: 1px solid #e2e8f0; }
        td:last-child { text-align: right; font-weight: 800; }
        .total { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding: 18px; border-radius: 18px; background: #fff7ed; }
        .total strong { color: #ff8a00; font-size: 26px; }
        .address { line-height: 1.55; }
        .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; display: flex; justify-content: space-between; gap: 20px; }
      </style>
    </head>
    <body>
      <main class="page">
        <section class="brand">
          <div class="logo">
            <div class="mark">D</div>
            <div>
              <h1>DieselUp</h1>
              <p>Diesel ordering and delivery receipt</p>
            </div>
          </div>
          <span class="badge">${escapeHtml(order.status.replaceAll('_', ' '))}</span>
        </section>
        <section class="hero">
          <div class="label">Receipt number</div>
          <div class="number">${escapeHtml(order.orderNumber)}</div>
          <div class="hero-grid">
            <div><span class="label">Delivery</span><strong>${escapeHtml(deliveryLabels[deliveryMode])}</strong></div>
            <div><span class="label">Quantity</span><strong>${escapeHtml(formatLitres(order.quantityLitres))}</strong></div>
            <div><span class="label">Total</span><strong>${escapeHtml(formatNaira(order.money.total))}</strong></div>
          </div>
        </section>
        <section class="grid">
          <div class="card">
            <h2>Payment</h2>
            <p class="muted">Method</p>
            <p><strong>${escapeHtml(paymentLabels[order.paymentMethod])}</strong></p>
            <p class="muted">Status</p>
            <p><strong>${escapeHtml(order.status.replaceAll('_', ' '))}</strong></p>
            ${order.manualFundingRequestId ? `<p class="muted">Manual review ID</p><p><strong>${escapeHtml(order.manualFundingRequestId)}</strong></p>` : ''}
          </div>
          <div class="card">
            <h2>Timeline</h2>
            <p class="muted">Created</p>
            <p><strong>${escapeHtml(createdAt?.toLocaleString() ?? 'Pending server timestamp')}</strong></p>
            ${scheduledFor ? `<p class="muted">Scheduled for</p><p><strong>${escapeHtml(scheduledFor.toLocaleString())}</strong></p>` : ''}
            ${estimatedArrival ? `<p class="muted">Estimated arrival</p><p><strong>${escapeHtml(estimatedArrival.toLocaleString())}</strong></p>` : ''}
          </div>
        </section>
        <section class="card">
          <h2>Charges</h2>
          <table>${rows}</table>
          <div class="total"><span>Total paid / payable</span><strong>${escapeHtml(formatNaira(order.money.total))}</strong></div>
        </section>
        <section class="card" style="margin-top: 22px;">
          <h2>Delivery address</h2>
          <p class="address"><strong>${escapeHtml(order.deliveryAddress.label)}</strong><br/>${escapeHtml(order.deliveryAddress.formattedAddress)}</p>
          ${order.deliveryAddress.instructions ? `<p class="muted">${escapeHtml(order.deliveryAddress.instructions)}</p>` : ''}
        </section>
        <section class="footer">
          <span>Generated securely by DieselUp.</span>
          <span>Payment verification is performed server-side.</span>
        </section>
      </main>
    </body>
  </html>`;
};
