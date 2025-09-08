export type DeliveryMethod = "post" | "pickup" | "both";
// Enums and status types
export type OrderStatus = 
  | "completed" 
  | "ongoing" 
  | "overdue" 
  | "pending" 
  | "shipped" 
  | "in-transit" 
  | "delivered" 
  | "cancelled";
export type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "other";
export type ComplaintStatus = "pending" | "investigating" | "resolved" | "closed";

export interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  address: string;
  actualDelivery?: string;
}

export interface Complaint {
  id: string;
  complainantId: string;
  respondentId?: string;
  orderId?: string;
  type: ComplaintType;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminResponse?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  bookId: string;
  userId: string;
  ownerId: string;
  borrowerId: string;
  lenderId: string;

  // Timing
  startDate: Date;
  endDate: Date;
  returnDate?: Date;

  // Fees
  totalAmount: number;

  // Status
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  
  // Shipping information
  shippingInfo?: ShippingInfo;
  
  // Review information
  rating?: number;
  review?: string;
  
  createdAt: string;
}
