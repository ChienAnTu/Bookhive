import axios from "axios";
import { getToken, getApiUrl } from "./auth";
import type { User } from "@/app/types/user";


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

// -------- Rebuild checkout (delete + create) --------
export async function rebuildCheckout(
  user: User,
  items: any[],
  shipping: Record<string, "delivery" | "pickup"> = {},
  selectedQuotes: Record<string, any> = {}
) {
  // 1. delete old checkout
  const existing = await getMyCheckouts();
  for (const co of existing) {
    await deleteCheckout(co.checkoutId);
    console.log("Deleted old checkout:", co.checkoutId);
  }

  // 2. build payload
  const payload = {
    userId: user.id,
    contactName: user.name || "",
    phone: user.phoneNumber || "",
    street: user.streetAddress || "",
    city: user.city || "",
    state: user.state || "",
    postcode: user.zipCode || "",
    country: "Australia",

    items: items.map((it) => {
      const bookId = it.bookId || it.id;   // ✅ 兼容 cart 和 checkout

      if (!bookId) {
        console.error("Missing bookId in item:", it);
        throw new Error("Item missing bookId, cannot create checkout");
      }
      const mode = it.mode || it.actionType?.toLowerCase();
      const quote = selectedQuotes[it.ownerId];

      return {
        itemId: it.itemId || it.cartItemId,
        bookId,
        ownerId: it.ownerId,
        actionType: (it.mode || it.actionType)?.toUpperCase(), // default BORROW
        price: mode === "purchase" ? it.salePrice : undefined,
        deposit: mode === "borrow" ? it.deposit : undefined,
        shippingMethod:
          shipping[bookId] ||
          it.shippingMethod ||
          "",
        serviceCode:
          quote?.serviceLevel === "Express"
            ? "AUS_PARCEL_EXPRESS"
            : "AUS_PARCEL_REGULAR",
      };
    }),
  };

  // 3. create a new checkout
  const newCheckout = await createCheckout(payload);
  console.log("Created new checkout:", newCheckout.checkoutId);
  return newCheckout;
}
