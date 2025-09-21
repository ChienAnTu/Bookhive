import axios from "axios";
import { getApiUrl } from "./auth";

const API_URL = getApiUrl();

export type Order = {
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
};

// Get all orders for current user
export async function getOrders(): Promise<Order[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/orders/my`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw error;
  }
}

// Get borrowing orders (orders where current user is borrower)
export async function getBorrowingOrders(): Promise<Order[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/orders/borrowing`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch borrowing orders:", error);
    throw error;
  }
}

// Get lending orders (orders where current user is owner)
export async function getLendingOrders(): Promise<Order[]> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/orders/lending`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch lending orders:", error);
    throw error;
  }
}

// Get specific order by ID
export async function getOrderById(orderId: string): Promise<Order> {
  try {
    const response = await axios.get(`${API_URL}/api/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch order ${orderId}:`, error);
    throw error;
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string, 
  status: Order["status"], 
  notes?: string
): Promise<Order> {
  try {
    const response = await axios.patch(
      `${API_URL}/api/v1/orders/${orderId}/status`, 
      { status, notes }, 
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Failed to update order ${orderId} status:`, error);
    throw error;
  }
}