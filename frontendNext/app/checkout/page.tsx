"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/store/cartStore";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

// ------- Types (adapt to your real shapes) -------
// Assuming your cart items still look like books with an ownerId and fees
// If you already switched to CartLine with priceSnapshot, you can swap in that type instead

type DeliveryChoice = "delivery" | "pickup"; // delivery == post

type Address = {
  country: string;
  state?: string;
  city: string;
  postcode: string;
  street: string;
  contactName: string;
  phone?: string;
};

type ShippingQuote = {
  id: string;
  ownerId: string;
  method: "post" | "pickup";
  carrier?: string;
  serviceLevel?: string; // Standard/Express
  cost: number; // AUD dollars
  currency: "AUD";
  etaDays?: number;
  expiresAt: string; // ISO
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore() as {
    cart: Array<{
      id: string;
      titleOr: string;
      author?: string;
      ownerId: string;
      deliveryMethod?: "post" | "self-help" | "both";
      fees?: { deposit: number; serviceFee: number };
    }>;
  };

  // ---------- UI State ----------
  const [address, setAddress] = useState<Address>({
    country: "Australia",
    city: "",
    postcode: "",
    street: "",
    contactName: "",
    phone: "",
  });

  // Per-item shipping choice (default by book capability)
  const [itemShipping, setItemShipping] = useState<Record<string, DeliveryChoice>>({});

  // Quotes per owner for DELIVERY (post)
  const [quotesByOwner, setQuotesByOwner] = useState<Record<string, ShippingQuote[]>>({});
  const [selectedQuoteByOwner, setSelectedQuoteByOwner] = useState<Record<string, ShippingQuote>>({});

  // ---------- Helpers ----------
  const normalizeDefaultChoice = (m?: "post" | "self-help" | "both"): DeliveryChoice => {
    if (m === "post" || m === "both" || !m) return "delivery";
    return "pickup"; // self-help → pickup
  };

  useEffect(() => {
    // initialize defaults once cart loads/changes
    const next: Record<string, DeliveryChoice> = {};
    for (const b of cart) {
      if (!itemShipping[b.id]) next[b.id] = normalizeDefaultChoice(b.deliveryMethod);
      else next[b.id] = itemShipping[b.id];
    }
    setItemShipping(next);
    // reset quotes when cart or choices change
    setQuotesByOwner({});
    setSelectedQuoteByOwner({});
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  // group by owner AND by choice
  const groups = useMemo(() => {
    const delivery: Record<string, typeof cart> = {};
    const pickup: Record<string, typeof cart> = {};
    for (const b of cart) {
      const choice = itemShipping[b.id] ?? normalizeDefaultChoice(b.deliveryMethod);
      const bucket = choice === "delivery" ? delivery : pickup;
      (bucket[b.ownerId] ||= []).push(b);
    }
    const orderKeys = (o: Record<string, unknown>) => Object.keys(o).sort();
    return {
      delivery,
      pickup,
      deliveryOwners: orderKeys(delivery),
      pickupOwners: orderKeys(pickup),
    };
  }, [cart, itemShipping]);

  // Compute totals (core = deposit + serviceFee for demo; replace with your snapshot calc if available)
  const coreTotals = useMemo(() => {
    let deposit = 0;
    let service = 0;
    for (const b of cart) {
      deposit += Number(b.fees?.deposit || 0);
      service += Number(b.fees?.serviceFee || 0);
    }
    return { deposit, service, core: +(deposit + service).toFixed(2) };
  }, [cart]);

  const shippingTotal = useMemo(() => {
    return Object.values(selectedQuoteByOwner).reduce((sum, q) => sum + (q?.cost || 0), 0);
  }, [selectedQuoteByOwner]);

  const grandTotal = useMemo(() => +(coreTotals.core + shippingTotal).toFixed(2), [coreTotals.core, shippingTotal]);

  // ---------- Mock: get quotes per owner for DELIVERY items ----------
  async function requestQuotes() {
    // Normally POST /api/shipping/quote with address + delivery groups
    // Here we mock it deterministically
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const result: Record<string, ShippingQuote[]> = {};

    for (const ownerId of groups.deliveryOwners) {
      const items = groups.delivery[ownerId];
      const base = 6.9; // base per shipment
      const perItem = 2.0 * items.length; // simplistic scaler
      result[ownerId] = [
        {
          id: `${ownerId}-STD`,
          ownerId,
          method: "post",
          carrier: "AusPost",
          serviceLevel: "Standard",
          cost: +(base + perItem).toFixed(2),
          currency: "AUD",
          etaDays: 3,
          expiresAt,
        },
        {
          id: `${ownerId}-EXP`,
          ownerId,
          method: "post",
          carrier: "AusPost",
          serviceLevel: "Express",
          cost: +(base + perItem + 4).toFixed(2),
          currency: "AUD",
          etaDays: 1,
          expiresAt,
        },
      ];
    }
    setQuotesByOwner(result);

    // default select first quote per owner
    const sel: Record<string, ShippingQuote> = {};
    for (const k of Object.keys(result)) sel[k] = result[k][0];
    setSelectedQuoteByOwner(sel);
  }

  // ---------- Handlers ----------
  const setChoice = (bookId: string, value: DeliveryChoice) => {
    setItemShipping((prev) => ({ ...prev, [bookId]: value }));
  };

  const placeOrder = async () => {
    // Submit one order with mixed shipments
    const shipments = Object.values(selectedQuoteByOwner).map((q) => ({ ownerId: q.ownerId, quoteId: q.id }));
    console.log("PLACE ORDER", {
      address,
      shipments,
      choices: itemShipping,
      grandTotal,
    });
    // const res = await fetch("/api/orders", { method: "POST", body: JSON.stringify({...}) });
    // const data = await res.json();
    // router.push(`/orders/${data.id}`)
    alert("Order created (mock). Check console.");
  };

  // ---------- UI ----------
  if (cart.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your cart is empty</h2>
        <Button variant="outline" onClick={() => router.push("/books")}>Back to Books</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Address */}
      <Card>
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">Shipping Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Contact Name" value={address.contactName} onChange={(e)=>setAddress({...address, contactName: e.target.value})} name="contactName" />
            <Input label="Phone" value={address.phone||""} onChange={(e)=>setAddress({...address, phone: e.target.value})} name="phone" />
            <Input label="Street" value={address.street} onChange={(e)=>setAddress({...address, street: e.target.value})} name="street" />
            <Input label="City" value={address.city} onChange={(e)=>setAddress({...address, city: e.target.value})} name="city" />
            <Input label="Postcode" value={address.postcode} onChange={(e)=>setAddress({...address, postcode: e.target.value})} name="postcode" />
            <Input label="Country" value={address.country} onChange={(e)=>setAddress({...address, country: e.target.value})} name="country" />
          </div>
        </div>
      </Card>

      {/* Item shipping choices */}
      <Card>
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">Items & Delivery Method</h2>
          <div className="space-y-3">
            {cart.map((b) => (
              <div key={b.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">《{b.titleOr}》</div>
                  <div className="text-sm text-gray-600">Owner: {b.ownerId}</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Method:</label>
                  <select
                    className="border rounded px-2 py-1"
                    value={itemShipping[b.id] ?? normalizeDefaultChoice(b.deliveryMethod)}
                    onChange={(e) => setChoice(b.id, e.target.value as DeliveryChoice)}
                  >
                    {/* options reflect book capability */}
                    {(b.deliveryMethod === "post" || b.deliveryMethod === "both" || !b.deliveryMethod) && (
                      <option value="delivery">Delivery</option>
                    )}
                    {(b.deliveryMethod === "self-help" || b.deliveryMethod === "both" || !b.deliveryMethod) && (
                      <option value="pickup">Pickup</option>
                    )}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Delivery groups (POST) */}
      {groups.deliveryOwners.length > 0 && (
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shipments – Delivery</h2>
              <Button variant="outline" onClick={requestQuotes}>Get Shipping Quotes</Button>
            </div>

            {groups.deliveryOwners.map((ownerId) => (
              <div key={ownerId} className="border rounded-md p-3 space-y-2">
                <div className="font-medium">Owner: {ownerId}</div>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  {groups.delivery[ownerId].map((b) => (
                    <li key={b.id}>《{b.titleOr}》</li>
                  ))}
                </ul>

                {/* Quotes chooser */}
                {quotesByOwner[ownerId]?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quotesByOwner[ownerId].map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedQuoteByOwner((prev) => ({ ...prev, [ownerId]: q }))}
                        className={`px-3 py-2 rounded border text-sm ${
                          selectedQuoteByOwner[ownerId]?.id === q.id ? "bg-black text-white" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {q.carrier} {q.serviceLevel || ""} • ${q.cost} • ETA {q.etaDays || "-"}d
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Quotes pending. Click "Get Shipping Quotes".</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pickup groups */}
      {groups.pickupOwners.length > 0 && (
        <Card>
          <div className="p-4 space-y-3">
            <h2 className="text-lg font-semibold">Shipments – Pickup</h2>
            {groups.pickupOwners.map((ownerId) => (
              <div key={ownerId} className="border rounded-md p-3 space-y-2">
                <div className="font-medium">Owner: {ownerId}</div>
                <ul className="text-sm text-gray-600 list-disc pl-5">
                  {groups.pickup[ownerId].map((b) => (
                    <li key={b.id}>《{b.titleOr}》</li>
                  ))}
                </ul>
                <p className="text-sm text-green-700">Pickup is free. Details will be shared after order.</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <div className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span>Deposits</span>
            <span>${coreTotals.deposit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Service Fees</span>
            <span>${coreTotals.service.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping (selected)</span>
            <span>${shippingTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Due</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500">Deposits may be refundable upon return. Shipping is charged per owner based on your selected quote.</p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-black text-white" onClick={placeOrder}>Place Order</Button>
      </div>
    </div>
  );
}
