import axios from "axios";
import { getApiUrl, getToken } from "@/utils/auth";
import type { OrderStatus } from "@/app/types/order";

const API_URL = getApiUrl();

export type Order = {
  order_id: string;
  status: OrderStatus;
  total_paid_amount: number;
  books: Array<{
    title: string;
    cover?: string;
    author?: string;
  }>;
  create_at: string;
  due_at: string | null;
};

export async function createOrder(checkoutId: string) {
  const token = getToken();
  const response = await axios.post(
    `${API_URL}/api/v1/orders/`,
    { checkout_id: checkoutId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

export async function listMyOrders(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Order[]> {
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
}

// Alias functions for different contexts
export const getOrders = listMyOrders;
export const getBorrowingOrders = listMyOrders;
export const getLendingOrders = listMyOrders;
