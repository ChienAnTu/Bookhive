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
  ownerId: string; // Lender
  borrowerId: string; // Borrower

  // books (multi)
  bookIds: string[];

  status: OrderStatus;

  // Time tracking
  startAt?: string; // When BORROWING starts
  dueAt?: string; // = startAt + max(books[].maxLendingDays)
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
  totalPaid: Money; // Initial payment (deposit + serviceFee + shippingOutFee + salePrice)
  totalRefunded?: Money; // What borrower got back (deposit - fees)

  notes?: string;
}

export interface ApiOrder {
  id: string;
  owner: {
    id: string;
    name: string;
  };
  borrower: {
    id: string;
    name: string;
  };
  status: OrderStatus;
  actionType: string;
  shippingMethod: string;
  depositOrSaleAmount: number;
  serviceFeeAmount: number;
  shippingOutFeeAmount: number;
  totalPaidAmount: number;
  contactName: string;
  phone: string;
  street: string;
  city: string;
  postcode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  startAt: string | null;
  returnedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  shippingOutTrackingNumber: string | null;
  shippingOutTrackingUrl: string | null;
  shippingReturnTrackingNumber: string | null;
  shippingReturnTrackingUrl: string | null;
  lateFeeAmount: number;
  damageFeeAmount: number;
  totalRefundedAmount: number;
  books: ApiBook[];
}

export interface ApiBook {
  bookId: string;
  titleEn: string;
  titleOr: string;
  author: string;
  coverImgUrl: string;
}