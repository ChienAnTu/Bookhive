import axios from "axios";
import { getApiUrl, getToken, getCurrentUser } from "./auth";

const API_URL = getApiUrl();

// Order type based on backend Order model
export type Order = {
  id: string;  // order ID from backend
  checkoutId: string;  // original checkout ID
  borrowerId: string;  // user who borrowed
  ownerId: string;  // user who owns the books
  bookIds: string[];  // array of book IDs
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
  
  // Additional fields
  contactName?: string;
  phone?: string;
  shippingFee?: number;
  actionType?: "borrow" | "buy";
};

// Create a new order from checkout
export async function createOrder(checkoutId: string): Promise<Order> {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/api/v1/orders/`,
      { checkout_id: checkoutId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
}

// Get all orders for current user
export async function getOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ orders: Order[]; total: number; page: number; pageSize: number }> {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/v1/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: params?.status,
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 20,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return { orders: [], total: 0, page: 1, pageSize: 20 };
  }
}

// Get borrowing orders (orders where current user is borrower)
export async function getBorrowingOrders(): Promise<Order[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    const result = await getOrders();
    return result.orders.filter(order => order.borrowerId === currentUser.id);
  } catch (error) {
    console.error("Failed to fetch borrowing orders:", error);
    return [];
  }
}

// Get lending orders (orders where current user is owner)
export async function getLendingOrders(): Promise<Order[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    const result = await getOrders();
    return result.orders.filter(order => order.ownerId === currentUser.id);
  } catch (error) {
    console.error("Failed to fetch lending orders:", error);
    return [];
  }
}

// Get specific order by ID
export async function getOrderById(orderId: string): Promise<Order> {
  try {
    const token = getToken();
    const response = await axios.get(`${API_URL}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch order:", error);
    throw error;
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<Order> {
  try {
    const token = getToken();
    const response = await axios.patch(
      `${API_URL}/api/v1/orders/${orderId}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
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
    const result = await getOrders();
    const orders = result.orders;
    
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

// Legacy exports for compatibility (using the same functions as above)
export const listMyOrders = getOrders;