import axios from "axios";
import { getApiUrl, getToken } from "@/utils/auth";

const API_URL = getApiUrl();

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
}) {
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
