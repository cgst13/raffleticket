export type DesignElementType =
  | 'text'
  | 'image'
  | 'ticketNumber'
  | 'qrCode'
  | 'buyerName'
  | 'solicitorName';

export interface BaseElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  italic?: boolean;
  underline?: boolean;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
}

export interface DesignElement {
  id: string;
  type: DesignElementType;
  x: number; // in mm or px, we standardize on normalized coordinate space (e.g., mm or px)
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  zIndex: number;
  locked: boolean;
  visible: boolean;
  content?: string; // For static text or image src
  style: BaseElementStyle;

  // Specific element configurations
  numberFormat?: {
    prefix?: string;
    suffix?: string;
    padding?: number;
    sampleValue?: string;
  };
  qrConfig?: {
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    foreground?: string;
    background?: string;
    padding?: number;
  };
}

export interface TicketDesign {
  id: string;
  raffleId: string;
  name: string;
  widthMm: number; // e.g. 140
  heightMm: number; // e.g. 50
  backgroundImageUrl?: string; // data URL or relative URL
  backgroundColor?: string;
  elements: DesignElement[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning';
  message: string;
  elementId?: string;
}
