/** Logistics provider abstraction (Skill 31). */
export type ShippingStatus =
  | "unknown"
  | "pending"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export interface TrackingInput {
  carrierCode?: string | null;
  carrierName?: string | null;
  trackingNo: string;
}

export interface TrackingEvent {
  time: string;
  location?: string;
  text: string;
}

export interface TrackingResult {
  trackingNo: string;
  carrierCode?: string | null;
  carrierName?: string | null;
  status: ShippingStatus;
  latestText?: string;
  events: TrackingEvent[];
  raw: unknown;
}

export interface ShippingProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  track(input: TrackingInput): Promise<TrackingResult>;
}
