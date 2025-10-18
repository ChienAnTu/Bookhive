import axios from "axios";
import { getToken, getApiUrl } from "./auth";
import type { Book } from "@/app/types/book";

interface AddCartItemPayload {
  bookId: string;
  ownerId: string;
  actionType: "borrow" | "purchase";
  price?: number;
  deposit?: number;
}

// Add to cart
export async function addItemToCart(payload: AddCartItemPayload) {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  const API_URL = getApiUrl();
  const body: Record<string, any> = {
    bookId: payload.bookId,
    ownerId: payload.ownerId,
    actionType: payload.actionType,
  };
  if (payload.price !== undefined) body.price = Number(payload.price);
  if (payload.deposit !== undefined) body.deposit = Number(payload.deposit);

  try {
    const res = await axios.post(`${API_URL}/api/v1/cart/items`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err: any) {
    if (err.response) {
      console.error("Add to cart failed:", err.response.data);
    }
    throw err;
  }
}

// delete item
export const removeItemsFromCart = async (ids: string[]) => {
  const token = getToken();
  if (!token) throw new Error("No auth token");

  const API_URL = getApiUrl();
  const url = `${API_URL}/api/v1/cart/items`;
  console.log("DELETE cart items:", ids);

  // 用 axios.request 明确传 data，且指定 JSON
  const res = await axios.request({
    method: "DELETE",
    url,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: ids,
  });
  return res.data; // { deletedCount: number }
};

// get cart's items
export const getMyCart = async () => {
  const token = getToken();
  if (!token) throw new Error("No auth token");
  const API_URL = getApiUrl();

  const res = await axios.get(`${API_URL}/api/v1/cart/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
