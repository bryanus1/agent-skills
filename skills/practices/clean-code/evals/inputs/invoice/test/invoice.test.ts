import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcTotals, formatInvoiceLine, invoiceNumber } from '../src/invoice.ts';

const line = { desc: 'Consultoría', qty: 2, price: 150, vat: 0.21 };

describe('invoice', () => {
  it('computes totals', () => {
    assert.deepEqual(calcTotals([line]), { net: 300, vat: 63, gross: 363 });
  });

  it('formats a line in EUR with VAT', () => {
    assert.equal(formatInvoiceLine(line, 40, 'EUR', true), 'Consultoría            2    300,00 € 21%');
  });

  it('formats a line in USD without VAT', () => {
    assert.equal(formatInvoiceLine(line, 40, 'USD', false), 'Consultoría            2     $300.00');
  });

  it('truncates long descriptions', () => {
    const long = { ...line, desc: 'Desarrollo de software a medida para backoffice' };
    assert.equal(formatInvoiceLine(long, 40, 'GBP', false), 'Desarrollo de sof...   2  300.00 GBP');
  });

  it('builds invoice numbers', () => {
    assert.equal(invoiceNumber(2026, 42), 'INV-2026-00042');
  });
});
