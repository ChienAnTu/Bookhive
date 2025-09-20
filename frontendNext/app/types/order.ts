// order interface

/** Monetary value in AUD (store cents to avoid floating-point errors) */
export type Money = {
  amount: number; // e.g., 2000 = AUD 20.00
};

/** Order status lifecycle */
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PENDING_SHIPMENT"
  | "BORROWING"
  | "OVERDUE"
  | "RETURNED"
  | "COMPLETED"
  | "CANCELED";

/** Delivery option */
export type DeliveryMethod = "post" | "pickup";

/** Minimal shipping reference (we do not manage logistics internally) */
export interface ShippingRef {
  carrier?: "AUSPOST" | "OTHER";
  trackingNumber?: string;
  trackingUrl?: string;
}

/** Core order structure (ultra simplified) */
export interface Order {
  id: string;
  ownerId: string;      // Lender
  borrowerId: string;   // Borrower

  // books (multi)
  bookIds: string[];

  status: OrderStatus;

  // Time tracking
  startAt?: string;     // When BORROWING starts
  dueAt?: string;       // = startAt + max(books[].maxLendingDays)
  returnedAt?: string;
  completedAt?: string;
  canceledAt?: string;

  createdAt: string;
  updatedAt: string;

  // Delivery
  deliveryMethod: DeliveryMethod;
  shippingOut?: ShippingRef;
  shippingReturn?: ShippingRef;

  // Pricing (locked at order creation)
  deposit: Money;
  serviceFee: Money;
  shippingOutFee?: Money;
  salePrice?: Money;

  // Post-return adjustments
  lateFee?: Money;
  damageFee?: Money;

  // Totals
  totalPaid: Money;        // Initial payment (deposit + serviceFee + shippingOutFee + salePrice)
  totalRefunded?: Money;   // What borrower got back (deposit - fees)

  notes?: string;
}
