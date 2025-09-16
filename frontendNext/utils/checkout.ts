import axios from "axios";
import { getToken, getApiUrl } from "./auth";

const API_URL = getApiUrl();

// -------- check checkout list --------
export async function getMyCheckouts() {
  const res = await fetch(`${API_URL}/api/v1/checkouts/list`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    if (res.status === 404) return []; // 没有 checkout
    throw new Error("Failed to fetch checkouts");
  }
  return res.json();
}

// -------- delete checkout --------
export async function deleteCheckout(checkoutId: string) {
  const res = await fetch(`${API_URL}/api/v1/checkouts/${checkoutId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to delete checkout");
  }
  return res.json();
}

// -------- create checkout --------
export async function createCheckout(payload: any) {
  try {
    const res = await axios.post(`${API_URL}/api/v1/checkouts/create`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });
    return res.data;
  } catch (err: any) {
    if (err.response) {
      console.error("Create checkout failed:", err.response.data);
      throw new Error("Failed to create checkout: " + JSON.stringify(err.response.data));
    }
    throw new Error("Failed to create checkout");
  }
}
