"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/store/cartStore";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

import { getCurrentUser, updateUser, getUserById } from "@/utils/auth";
import type { User } from "@/app/types/user";

import { getMyCheckouts, deleteCheckout, createCheckout } from "@/utils/checkout";
import { listServiceFees } from "@/utils/serviceFee";
import { getShippingQuotes } from "@/utils/shipping";



// 页面进入时 → 查 checkout，没有就新建
// 金额全用后端返回的计算结果
// 修改地址 或 修改运输方式 → 重建 checkout（删除+新建）
// 点击下单 → 提交 checkout

type DeliveryChoice = "delivery" | "pickup"; // delivery == post

type ShippingQuote = {
  id: string;
  ownerId: string;
  method: "post" | "pickup";
  carrier?: string;
  serviceLevel?: string; // Standard/Express
  cost: number; // AUD dollars
  currency: "AUD";
  etaDays?: string;
  expiresAt: string; // ISO
};

export default function CheckoutPage() {
  const router = useRouter();
  const [globalShippingChoice, setGlobalShippingChoice] = useState<"standard" | "express" | null>(null);
  const { cart } = useCartStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [ownersMap, setOwnersMap] = useState<Record<string, { name: string; zipCode: string }>>({});
  const [serviceRate, setServiceRate] = useState<number>(0);
const [address, setAddress] = useState({
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  postcode: "",
});

  // Per-item shipping choice (default by book capability)
  const [itemShipping, setItemShipping] = useState<Record<string, "delivery" | "pickup" | "">>({});

  // Quotes per owner for DELIVERY (post)
  const [quotesByOwner, setQuotesByOwner] = useState<Record<string, ShippingQuote[]>>({});
  const [selectedQuoteByOwner, setSelectedQuoteByOwner] = useState<Record<string, ShippingQuote>>({});

  // 1. 拉取当前用户，预填地址
  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    }
    loadUser();
  }, []);

  // 2. 拉取 owner 信息
  useEffect(() => {
    async function loadOwners() {
      const uniqueOwnerIds = Array.from(new Set(cart.map((b) => b.ownerId)));
      const map: Record<string, { name: string; zipCode: string }> = {};

      for (const id of uniqueOwnerIds) {
        try {
          const u = await getUserById(id);
          map[id] = {
            name: u?.name || "Unknown Owner",
            zipCode: u?.zipCode || "6000", // a fallback
          };
        } catch {
          map[id] = { name: id, zipCode: "0000" };
        }
      }

      setOwnersMap(map);
    }

    if (cart.length > 0) loadOwners();
  }, [cart]);

const currentCheckout = checkouts.length > 0 ? checkouts[0] : null;

  // 3. 拉取 checkout，如果没有则创建
  useEffect(() => {
  async function initCheckout() {
    let data = await getMyCheckouts();
    if (!data || data.length === 0) {
      // 构造 payload
      const payload = buildPayload(currentUser, null, cart, {});
      const created = await createCheckout(payload);
      data = [created];
    }
    setCheckouts(data);
  }

  if (cart.length > 0 && currentUser) initCheckout();
}, [cart, currentUser]);

  //4. 获取service fee
  useEffect(() => {
    async function loadFee() {
      try {
        const fees = await listServiceFees();
        const activePercent = fees.find((f: any) => f.feeType === "PERCENT" && f.status);
        if (activePercent) {
          setServiceRate(Number(activePercent.value)); // 比如 5 (%)
        }
      } catch (err) {
        console.error("Failed to load service fee:", err);
      }
    }
    loadFee();
  }, []);

  function buildPayload(
  user: User | null,
  checkout: any | null,
  cart: any[],
  shipping: Record<string, "delivery" | "pickup">
) {
  return {
    userId: user?.id,
    contactName: checkout?.contactName ?? user?.name ?? "",
    phone: checkout?.phone ?? user?.phoneNumber ?? "",
    street: checkout?.street ?? user?.streetAddress ?? "",
    city: checkout?.city ?? user?.city ?? "",
    postcode: checkout?.postcode ?? user?.zipCode ?? "",
    country: "Australia",
    items: cart.map((it) => ({
      bookId: it.id,
      ownerId: it.ownerId,
      actionType: it.mode.toUpperCase(),
      price: it.mode === "purchase" ? it.salePrice : undefined,
      deposit: it.mode === "borrow" ? it.deposit : undefined,
      shippingMethod: shipping[it.id] || "",
      serviceCode: "AUS_PARCEL_REGULAR",
    })),
  };
}


  // 封装：根据当前页面信息改动，重建 checkout （删除+新建）
  const rebuildCheckout = async (newItemShipping: Record<string, "delivery" | "pickup">) => {
    try {
      // 如果已有 checkout，先删掉
      if (checkouts.length > 0) {
        await deleteCheckout(checkouts[0].checkoutId);
        setCheckouts([]);
      }

      // 构造 payload
      const cleaned: Record<string, "delivery" | "pickup"> = Object.fromEntries(
  Object.entries(itemShipping).filter(
    ([, v]) => v === "delivery" || v === "pickup"
  )
) as Record<string, "delivery" | "pickup">;

const payload = buildPayload(currentUser, currentCheckout, cart, cleaned);


      // 调用后端创建 checkout
      const newCheckout = await createCheckout(payload);
      setCheckouts([newCheckout]);
      console.error("Rebuild checkout:", newCheckout);

    } catch (err) {
      console.error("Failed to rebuild checkout:", err);
      alert("Failed to update checkout, please try again.");
    }
  };


  useEffect(() => {
    // initialize defaults once cart loads/changes
    const next: Record<string, "delivery" | "pickup" | ""> = {};
    for (const b of cart) {
      // ✅ 每次进入页面都清空
      next[b.id] = "";
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
      const choice = itemShipping[b.id];
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

  // ---------- Get quotes per owner for DELIVERY items ----------
  async function requestQuotes() {
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const result: Record<string, ShippingQuote[]> = {};

    for (const ownerId of groups.deliveryOwners) {
      const items = groups.delivery[ownerId];

      // 假设每本书 30x20x5 cm, 0.5kg
      const length = 30;
      const width = 20;
      const height = 5 * items.length;
      const weight = 0.5 * items.length;

      try {
        const data = await getShippingQuotes(
          ownersMap[ownerId]?.zipCode || "2000", // 发货人邮编（书主）
          String(checkouts[0]?.postcode || ""),                     // 收货人邮编（当前用户）
          length,
          width,
          height,
          weight
        );

        result[ownerId] = [
          {
            id: `${ownerId}-STD`,
            ownerId,
            method: "post",
            carrier: "AusPost",
            serviceLevel: "Standard",
            cost: parseFloat(String(data.AUS_PARCEL_REGULAR?.total_cost ?? "0")),
            currency: "AUD",
            etaDays: data.AUS_PARCEL_REGULAR?.delivery_time || "-",
            expiresAt,
          },
          {
            id: `${ownerId}-EXP`,
            ownerId,
            method: "post",
            carrier: "AusPost",
            serviceLevel: "Express",
            cost: parseFloat(String(data.AUS_PARCEL_EXPRESS?.total_cost || "0")),
            currency: "AUD",
            etaDays: data.AUS_PARCEL_EXPRESS?.delivery_time || "-",
            expiresAt,
          },
        ];
      } catch (err) {
        console.error(`Failed to fetch shipping quotes for owner ${ownerId}:`, err);
        result[ownerId] = [];
      }
    }

    setQuotesByOwner(result);

// 默认选择每个 owner 的 Standard 报价
const sel: Record<string, ShippingQuote> = {};
for (const k of Object.keys(result)) {
  if (result[k]?.length) {
    // 找 Standard 报价
    const std = result[k].find((q) => q.serviceLevel === "Standard");
    sel[k] = std || result[k][0]; // 找不到 Standard，就 fallback 第一个
  }
}
setSelectedQuoteByOwner(sel);

  }

  // ---------- Handlers ----------
  const setChoice = (bookId: string, value: DeliveryChoice) => {
    setItemShipping(prev => {
      const next = { ...prev, [bookId]: value };
      return next;
    });
  };


  // 下单
  const placeOrder = async () => {
    if (checkouts.length === 0) {
      alert("No checkout found, please refresh.");
      return;
    }

    const checkout = checkouts[0];

    // 校验地址
    if (!checkout.contactName || !checkout.phone || !checkout.street || !checkout.city || !checkout.postcode) {
      alert("Please complete your delivery address before placing the order.");
      return;
    }

    // 校验金额
    if (!checkout.totalDue || checkout.totalDue <= 0) {
      alert("Order total is invalid. Please refresh.");
      return;
    }

    // ✅ 一切正常，可以提交
    console.log("Placing order with checkout:", checkout);
    alert(`Order placed! Total due: $${checkout.totalDue}`);
    router.push(`/orders/${checkout.checkoutId}`);
  };


  // ---------- When Empty ----------
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Delivery Address</h2>
            <Button
  variant="outline"
  onClick={async () => {
    if (!currentUser || checkouts.length === 0) return;
    const checkout = checkouts[0];

    // 更新用户 Profile
    await updateUser({
      id: currentUser.id,
      state: checkout.state,
      city: checkout.city,
      zipCode: checkout.postcode,
      streetAddress: checkout.street,
      name: checkout.contactName,
      phoneNumber: checkout.phone,
    });

    // 重建 checkout
    const cleaned: Record<string, "delivery" | "pickup"> = Object.fromEntries(
      checkout.items.map((it: any) => [it.bookId, it.shippingMethod])
    ) as Record<string, "delivery" | "pickup">;

    await rebuildCheckout(cleaned);

    alert("Address saved!");
  }}
  className="text-sm"
>
  Save Address
</Button>


          </div>
{checkouts.length > 0 && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Input
      label="Contact Name"
      value={checkouts[0].contactName || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], contactName: e.target.value }] : prev
        )
      }
    />
    <Input
      label="Phone"
      value={checkouts[0].phone || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], phone: e.target.value }] : prev
        )
      }
    />
    <Input
      label="Street"
      value={checkouts[0].street || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], street: e.target.value }] : prev
        )
      }
    />
    <Input
      label="City"
      value={checkouts[0].city || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], city: e.target.value }] : prev
        )
      }
    />
    <Input
      label="State"
      value={checkouts[0].state || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], state: e.target.value }] : prev
        )
      }
    />
    <Input
      label="Postcode"
      value={checkouts[0].postcode || ""}
      onChange={(e) =>
        setCheckouts(prev =>
          prev.length ? [{ ...prev[0], postcode: e.target.value }] : prev
        )
      }
    />
  </div>
)}


        </div>
      </Card>

      {/* Items & Delivery */}
      <Card>
        <div className="p-4 space-y-3">

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Items & Delivery</h2>
            <Button
  variant="outline"
  onClick={async () => {
    // 校验所有 item 是否选择了配送方式
    const unselected = cart.filter((b) => !itemShipping[b.id]);
    if (unselected.length > 0) {
      alert("Please select delivery method for all items before saving.");
      return;
    }

    // 清理掉空值，只保留 "delivery" | "pickup"
    const cleaned: Record<string, "delivery" | "pickup"> = Object.fromEntries(
      Object.entries(itemShipping).filter(
        ([, v]) => v === "delivery" || v === "pickup"
      )
    ) as Record<string, "delivery" | "pickup">;

    await rebuildCheckout(cleaned);
    await requestQuotes();

    alert("Delivery methods saved!");
  }}
  className="text-sm"
>
  Save Delivery Method
</Button>

          </div>

          {/* Items 分组 */}
          <div className="space-y-4">
            {Object.entries(
              cart.reduce<Record<string, typeof cart>>((acc, item) => {
                (acc[item.ownerId] ||= []).push(item);
                return acc;
              }, {})
            ).map(([ownerId, items]) => (
              <div key={ownerId} className="border rounded-md p-4 space-y-3 bg-gray-100">
                <div className="font-semibold">
                  📚 Owner: {ownersMap[ownerId]?.name}
                </div>
                <div className="divide-y space-y-2">
                  {items.map((b) => (
                    <div key={b.id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">《{b.titleOr}》
                            <span className="text-sm text-blue-600">
                              Trading Way: {b.mode === "borrow" ? "Borrow" : "Purchase"}
                            </span>
                          </div>
                        </div>

                        {/* Delivery / Pickup select */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">Delivery Method:</span>
                          {b.deliveryMethod === "post" && (
                            <span className="px-4 py-1 rounded bg-black text-white text-sm">Delivery</span>
                          )}
                          {b.deliveryMethod === "pickup" && (
                            <span className="px-4 py-1 rounded bg-black text-white text-sm">Pickup</span>
                          )}
                          {b.deliveryMethod === "both" && (
                            <select
                              value={itemShipping[b.id]}
                              onChange={(e) => setChoice(b.id, e.target.value as "delivery" | "pickup")}
                              className="px-3 py-1 border rounded bg-white text-sm"

                            >
                              <option value="" disabled>
                                -- Select option --
                              </option>
                              <option value="delivery">Delivery</option>
                              <option value="pickup">Pickup</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Pickup hint */}
                      {itemShipping[b.id] === "pickup" && (
                        <p className="text-sm text-green-700 mt-2">
                          Pickup is free. Details will be shared after order.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shipping Quotes（if chose delivery, display under this owner） */}
                {items.some((b) => itemShipping[b.id] === "delivery") && quotesByOwner[ownerId]?.length && (
                  <div className="mt-4 p-4 rounded-md border bg-white">
                    <h4 className="text-sm font-semibold mb-2 text-gray-800">AusPost Shipping Quotes</h4>
                    <div className="flex gap-2">
                      {quotesByOwner[ownerId].map((q) => {
                        const choiceKey = q.serviceLevel === "Standard" ? "standard" : "express";

                        // 默认选中 Standard
                        if (!globalShippingChoice && choiceKey === "standard") {
                          setGlobalShippingChoice("standard");
                        }

                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setGlobalShippingChoice(choiceKey)}
                            className={`px-3 py-2 rounded border text-sm ${globalShippingChoice === choiceKey
                              ? "bg-black text-white"
                              : "bg-white hover:bg-gray-50"
                              }`}
                          >
                            {q.carrier} {q.serviceLevel} • ${q.cost} • ETA {q.etaDays || "-"}d
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary */}
      <Card>
        <div className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span>Deposits</span>
            <span>${checkouts[0]?.deposit?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping (selected)</span>
            <span>${checkouts[0]?.shippingFee?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Service Fees</span>
            <span>${checkouts[0]?.serviceFee?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total Due</span>
            <span>${checkouts[0]?.totalDue?.toFixed(2) || "0.00"}</span>
          </div>
          <p className="text-xs text-gray-500">
            Deposits may be refundable upon return. Shipping is charged per owner based on your selected quote.
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-black text-white" onClick={placeOrder}>Place Order</Button>
      </div>
    </div>
  );
}
