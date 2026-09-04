export interface AppConfig {
  name: string;
  subtitle: string;
  version: string;
  currency: {
    code: string;
    symbol: string;
    locale: string;
  };
  colors: {
    primary: string;
    dark: string;
    background: string;
    card: string;
    border: string;
    textMuted: string;
  };
  defaults: {
    ticketAmount: number;
    numberPadding: number;
    ticketsPerBooklet: number;
    bookletsPerRow: number;
    totalBooklets: number;
    startingNumber: string;
    paperSize: 'Folio' | 'A4' | 'Letter' | 'Legal' | 'Custom';
    orientation: 'portrait' | 'landscape';
    ticketWidthMm: number;
    ticketHeightMm: number;
  };
}

export const appConfig: AppConfig = {
  name: 'RafflePro',
  subtitle: 'Raffle Ticket Management & Printing System',
  version: '1.0.0',
  currency: {
    code: 'PHP',
    symbol: '₱',
    locale: 'en-PH',
  },
  colors: {
    primary: '#F97316',
    dark: '#111111',
    background: '#F8F8F7',
    card: '#FFFFFF',
    border: '#E5E5E5',
    textMuted: '#6B7280',
  },
  defaults: {
    ticketAmount: 100,
    numberPadding: 6,
    ticketsPerBooklet: 10,
    bookletsPerRow: 5,
    totalBooklets: 5,
    startingNumber: '000001',
    paperSize: 'Folio',
    orientation: 'portrait',
    ticketWidthMm: 140,
    ticketHeightMm: 50,
  },
};
