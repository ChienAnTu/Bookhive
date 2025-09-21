import axios from "axios";
import { getApiUrl, getCurrentUser } from "./auth";

const API_URL = getApiUrl();

// Redesigned Order type based on actual backend Checkout structure
export type Order = {
  id: string;  // checkoutId from backend
  borrowerId: string;  // userId from checkout
  ownerId: string;  // ownerId from checkout items
  bookIds: string[];  // bookId from checkout items
  status: "PENDING_PAYMENT" | "PENDING_SHIPMENT" | "BORROWING" | "OVERDUE" | "RETURNED" | "COMPLETED" | "CANCELED";
  createdAt: string;
  updatedAt?: string;
  dueAt?: string;
  returnedAt?: string;
  shippingInfo?: {
    address: string;
    trackingNumber?: string;
    carrier?: string;
  };
  deposit: {
    amount: number;
    currency: string;
    status: "PENDING" | "PAID" | "REFUNDED" | "DEDUCTED";
  };
  totalAmount: number;
  serviceFee: number;
  notes?: string;
  
  // Additional checkout-specific fields
  contactName?: string;
  phone?: string;
  shippingFee?: number;
  actionType?: "borrow" | "buy";
};

// Convert checkout data to Order format
function checkoutToOrder(checkout: any): Order {
  const firstItem = checkout.items?.[0];
  return {
    id: checkout.checkoutId,
    borrowerId: checkout.userId,
    ownerId: firstItem?.ownerId || "",
    bookIds: checkout.items?.map((item: any) => item.bookId) || [],
    status: mapCheckoutStatusToOrderStatus(checkout.status),
    createdAt: checkout.createdAt,
    updatedAt: checkout.updatedAt,
    shippingInfo: {
      address: `${checkout.street}, ${checkout.city}, ${checkout.state} ${checkout.postcode}`,
      trackingNumber: undefined,
      carrier: "Australia Post"
    },
    deposit: {
      amount: checkout.deposit || 0,
      currency: "AUD",
      status: "PENDING"
    },
    totalAmount: checkout.totalDue || 0,
    serviceFee: checkout.serviceFee || 0,
    contactName: checkout.contactName,
    phone: checkout.phone,
    shippingFee: checkout.shippingFee
  };
}

// Map checkout status to order status
function mapCheckoutStatusToOrderStatus(checkoutStatus: string): Order["status"] {
  switch (checkoutStatus) {
    case "pending": return "PENDING_PAYMENT";
    case "confirmed": return "PENDING_SHIPMENT";
    case "shipped": return "BORROWING";
    case "delivered": return "BORROWING";
    case "completed": return "COMPLETED";
    case "cancelled": return "CANCELED";
    default: return "PENDING_PAYMENT";
  }
}

// Get all orders for current user (borrowing orders from checkouts)
export async function getOrders(): Promise<Order[]> {
  try {
    // TODO: Implement actual checkout API integration
    // For now return empty array to prevent 404 errors
    console.log("getOrders: returning empty array (API not implemented)");
    return [];
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
}

// Get borrowing orders (orders where current user is borrower)
export async function getBorrowingOrders(): Promise<Order[]> {
  try {
    // TODO: Implement actual checkout API integration
    console.log("getBorrowingOrders: returning empty array (API not implemented)");
    return [];
  } catch (error) {
    console.error("Failed to fetch borrowing orders:", error);
    return [];
  }
}

// Get lending orders (books I own that others have borrowed)
export async function getLendingOrders(): Promise<Order[]> {
  try {
    // TODO: Implement actual books API integration
    console.log("getLendingOrders: returning empty array (API not implemented)");
    return [];
  } catch (error) {
    console.error("Failed to fetch lending orders:", error);
    return [];
  }
}

// Get specific order by ID (checkout ID)
export async function getOrderById(orderId: string): Promise<Order> {
  try {
    // TODO: Implement when backend has specific checkout get endpoint
    // For now, throw error with helpful message
    throw new Error(`Order ${orderId} not found - API not implemented`);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    throw error;
  }
}

// Update order status (not implemented in backend yet)
export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order> {
  try {
    // TODO: Implement when backend has order status update endpoint
    throw new Error("Order status update not implemented yet");
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
}

// Get order statistics
export async function getOrderStats(): Promise<{
  total: number;
  pending: number;
  active: number;
  completed: number;
}> {
  try {
    const orders = await getOrders();
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === "PENDING_PAYMENT" || o.status === "PENDING_SHIPMENT").length,
      active: orders.filter(o => o.status === "BORROWING").length,
      completed: orders.filter(o => o.status === "COMPLETED").length
    };
  } catch (error) {
    console.error("Failed to get order stats:", error);
    return { total: 0, pending: 0, active: 0, completed: 0 };
  }
}