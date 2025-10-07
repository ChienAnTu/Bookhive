//payments.ts
import axios from "axios";
import { getApiUrl } from "./auth";

const API_URL = getApiUrl();

export async function initiatePayment(payload: {
  user_id: string;
  amount: number;        // total in cents
  currency?: string;     // e.g. "aud"
  deposit?: number;      // in cents
  purchase?: number;     // in cents
  shipping_fee?: number; // in cents
  service_fee?: number;  // in cents
  checkout_id: string;
}) {
  const res = await axios.post(`${API_URL}/payment_gateway/payment/initiate`, payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data as {
    message: string;
    payment_id: string;
    client_secret: string;
    status: string;
    amount: number;
    currency: string;
  };
}

// Create a Stripe Express account and get onboarding link
export async function createExpressAccount(email: string) {
  const res = await axios.post(
    `${API_URL}/payment_gateway/accounts/express`,
    { email },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Idempotency-Key": `acct-create-${email}`,
      },
      withCredentials: true,
    }
  );
  return res.data as { account_id: string; onboarding_url: string };
}


// Distribute the shipping fee to the owner（Stripe Connect Transfer）
export async function distributeShippingFee(
  paymentId: string,
  lenderAccountId: string,      // e.g "acct_123..."
) {
  const res = await axios.post(
    `${API_URL}/payment_gateway/payment/distribute_shipping_fee/${paymentId}`,
    { lender_account_id: lenderAccountId },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Idempotency-Key": `shipfee-${paymentId}-${lenderAccountId}`, // Prevent Duplicate
      },
      withCredentials: true,
    }
  );
  return res.data as {
    message: string;
    transfer_id: string;
    amount: number;     // cents
    currency: string;   // "aud"
    destination: string;
  };
}

// refund payment
export async function refundPayment(
  paymentId: string,
  opts?: { amount_cents?: number; reason?: string } // partial refunds in the future
) {
  const res = await axios.post(
    `${API_URL}/payment_gateway/payment/refund/${paymentId}`,
    { reason: opts?.reason },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Idempotency-Key": `refund-${paymentId}-${opts?.amount_cents ?? "full"}`,
      },
      withCredentials: true,
    }
  );
  return res.data as {
    payment_id: string;
    refund_id: string;
    status: "succeeded" | "pending" | "failed" | string;
    amount_refunded: number; // cents
    currency: string;        // e.g. "aud"
    reason?: string | null;
  };
}


