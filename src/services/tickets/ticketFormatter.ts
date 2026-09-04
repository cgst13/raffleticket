import { appConfig } from '../../config/appConfig';

export interface FormatOptions {
  prefix?: string;
  suffix?: string;
  padding?: number;
}

export const ticketFormatter = {
  /**
   * Format integer sequence to display string.
   * e.g., formatTicketNumber(1, { prefix: 'R-', padding: 6 }) => 'R-000001'
   * e.g., formatTicketNumber(1, { padding: 4 }) => '0001'
   */
  formatTicketNumber(
    sequence: number,
    options: FormatOptions = {}
  ): string {
    const { prefix = '', suffix = '', padding = appConfig.defaults.numberPadding } = options;
    const padded = String(sequence).padStart(padding, '0');
    return `${prefix}${padded}${suffix}`;
  },

  /**
   * Parse numeric sequence from formatted ticket string or number input
   */
  parseSequence(input: string | number): number {
    if (typeof input === 'number') return input;
    const digits = input.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  },

  /**
   * Detect padding length from a sample string like '0001' => 4
   */
  detectPadding(sample: string): number {
    const match = sample.match(/\d+/);
    if (!match) return appConfig.defaults.numberPadding;
    return match[0].length;
  },

  /**
   * Format currency in Philippine Peso (PHP)
   * e.g. 100 => ₱100.00
   */
  formatCurrency(amount: number): string {
    try {
      return new Intl.NumberFormat(appConfig.currency.locale, {
        style: 'currency',
        currency: appConfig.currency.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `₱${amount.toFixed(2)}`;
    }
  },

  /**
   * Format date into friendly Philippine format
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '—';
    try {
      return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  },

  /**
   * Format date and time
   */
  formatDateTime(dateTimeString?: string): string {
    if (!dateTimeString) return '—';
    try {
      return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(new Date(dateTimeString));
    } catch {
      return dateTimeString;
    }
  },
};
