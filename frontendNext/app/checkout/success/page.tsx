"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<"succeeded"|"processing"|"canceled"|"unknown">("unknown");
  const [pi, setPi] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // Common parameters brought back from Stripe
    const paymentIntent = p.get("payment_intent");
    const redirectStatus = p.get("redirect_status"); // succeeded/failed/redirect
    const cs = p.get("payment_intent_client_secret");

    setPi(paymentIntent);

    // only for front-end display. The true status is determined by the backend /webhook
    if (redirectStatus === "succeeded") setStatus("succeeded");
    else if (redirectStatus === "processing") setStatus("processing");
    else if (redirectStatus === "failed" || redirectStatus === "canceled") setStatus("canceled");
    else setStatus("unknown");

  }, []);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment Result</h1>

      {status === "succeeded" && (
        <div className="p-4 rounded-md bg-green-50 border border-green-200">
          <p className="font-medium text-green-700">Payment succeeded!</p>
          <p className="text-sm text-green-700">Payment Intent: {pi}</p>
        </div>
      )}

      {status === "processing" && (
        <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
          <p className="font-medium text-yellow-800">Payment processing...</p>
          <p className="text-sm text-yellow-800">We’ll update your order once it clears.</p>
        </div>
      )}

      {(status === "canceled" || status === "unknown") && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <p className="font-medium text-red-700">Payment not completed.</p>
          <p className="text-sm text-red-700">You can try again from the checkout page.</p>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/checkout" className="px-4 py-2 rounded-md border">Back to Checkout</Link>
        <Link href="/borrowing" className="px-4 py-2 rounded-md bg-black text-white">View Orders</Link>
      </div>
    </div>
  );
}
