import axios from "axios";
import { getApiUrl, getToken } from "./auth";

// Type definitions for orders
export interface Order {
  id: string;
  borrowerId: string;
  ownerId: string;
  bookIds: string[];
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
}

// Get all orders for current user
export const getOrders = async (userId?: string): Promise<Order[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const endpoint = userId ? `/api/v1/orders/user/${userId}` : "/api/v1/orders/my";
    
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
};

// Get borrowing orders (orders where current user is borrower)
export const getBorrowingOrders = async (): Promise<Order[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/orders/borrowing`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch borrowing orders:", error);
    throw error;
  }
};

// Get lending orders (orders where current user is owner)
export const getLendingOrders = async (): Promise<Order[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/orders/lending`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch lending orders:", error);
    throw error;
  }
};

// Get specific order by ID
export const getOrderById = async (orderId: string): Promise<Order> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.get(`${API_URL}/api/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch order ${orderId}:`, error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (
  orderId: string, 
  status: Order["status"], 
  notes?: string
): Promise<Order> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.patch(
      `${API_URL}/api/v1/orders/${orderId}/status`, 
      { status, notes }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to update order ${orderId} status:`, error);
    throw error;
  }
};

// Cancel order
export const cancelOrder = async (orderId: string, reason?: string): Promise<Order> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const response = await axios.post(
      `${API_URL}/api/v1/orders/${orderId}/cancel`, 
      { reason }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to cancel order ${orderId}:`, error);
    throw error;
  }
};

// Search/filter orders
export const searchOrders = async (params: {
  status?: string;
  search?: string;
  type?: "borrowing" | "lending";
}): Promise<Order[]> => {
  const token = getToken();
  if (!token) throw new Error("No authentication token");

  try {
    const API_URL = getApiUrl();
    const queryParams = new URLSearchParams();
    
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.search) queryParams.append("search", params.search);
    if (params.type) queryParams.append("type", params.type);
    
    const queryString = queryParams.toString();
    const url = queryString ? `${API_URL}/api/v1/orders?${queryString}` : `${API_URL}/api/v1/orders`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to search orders:", error);
    throw error;
  }
};