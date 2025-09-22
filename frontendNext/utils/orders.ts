import axios from "axios";
import { getApiUrl, getToken } from "./auth";

const API_URL = getApiUrl();

// Order type matching the EXACT backend OrderSummary response
export type Order = {
  order_id: string;
  status: string;
  total_paid_amount: number;
  books: Array<{
    title: string;
    cover: string;
  }>;
};

// Create order - matches backend exactly
export async function createOrder(checkoutId: string) {
  try {
    const token = getToken();
    if (!token) throw new Error("Authentication required");
    
    const response = await axios.post(
      `${API_URL}/api/v1/orders/`,
      { checkout_id: checkoutId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create order:", error);
    throw error;
  }
}

// Get orders - matches backend exactly  
export async function getOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Order[]> {
  try {
    const token = getToken();
    if (!token) return [];
    
    const response = await axios.get(`${API_URL}/api/v1/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        status: params?.status,
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 20,
      },
    });
    return response.data || [];
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
}

// Simple aliases - backend doesn't distinguish between borrowing/lending yet
export const getBorrowingOrders = getOrders;
export const getLendingOrders = getOrders;
export const listMyOrders = getOrders;

// Not implemented in backend - return helpful errors
export async function getOrderById(orderId: string): Promise<Order> {
  throw new Error(`Backend API doesn't support getting orders by ID yet. Requested: ${orderId}`);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  throw new Error(`Backend API doesn't support updating order status yet. Order: ${orderId}, Status: ${status}`);
}

export async function getOrderStats() {
  try {
    const orders = await getOrders();
    return {
      total: orders.length,
      pending: orders.filter(o => o.status.toLowerCase().includes("pending")).length,
      active: orders.filter(o => !o.status.toLowerCase().includes("completed")).length,
      completed: orders.filter(o => o.status.toLowerCase().includes("completed")).length
    };
  } catch (error) {
    return { total: 0, pending: 0, active: 0, completed: 0 };
  }
}