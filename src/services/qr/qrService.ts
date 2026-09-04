import QRCode from 'qrcode';

export interface QrOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  width?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

// In-memory cache for generated QR data URLs to maximize performance
const qrCache = new Map<string, string>();

export const qrService = {
  /**
   * Generates standard QR payload identifier
   */
  generatePayload(ticketId: string): string {
    return `raffle://ticket/${ticketId}`;
  },

  /**
   * Extracts ticket UUID from QR payload
   */
  extractTicketId(payload: string): string | null {
    if (!payload) return null;
    const trimmed = payload.trim();
    if (trimmed.startsWith('raffle://ticket/')) {
      return trimmed.replace('raffle://ticket/', '');
    }
    // Fallback: check if payload is directly a UUID or has ticket/
    const match = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0] : trimmed;
  },

  /**
   * Generates a fast Base64 Data URL for a QR code with caching
   */
  async toDataURL(text: string, options: QrOptions = {}): Promise<string> {
    const cacheKey = `${text}_${JSON.stringify(options)}`;
    if (qrCache.has(cacheKey)) {
      return qrCache.get(cacheKey)!;
    }

    try {
      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: options.errorCorrectionLevel || 'M',
        margin: options.margin !== undefined ? options.margin : 1,
        width: options.width || 200,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF00', // transparent default light
        },
      });

      qrCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate QR data URL:', err);
      return '';
    }
  },

  /**
   * Clear cache if needed
   */
  clearCache(): void {
    qrCache.clear();
  },
};
