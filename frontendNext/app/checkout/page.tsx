"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

import { getCurrentUser, updateUser, getUserById } from "@/utils/auth";
import type { User } from "@/app/types/user";
import { getBookById } from "@/utils/books";

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

interface CheckoutItem {
  bookId: string;
  ownerId: string;
  titleOr: string;
  actionType: "BORROW" | "PURCHASE";
  price?: number;
  deposit?: number;
  deliveryMethod?: "post" | "pickup" | "both";
  shippingMethod?: "delivery" | "pickup";
}


export default function CheckoutPage() {
  const router = useRouter();
  const [globalShippingChoice, setGlobalShippingChoice] = useState<"standard" | "express" | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [ownersMap, setOwnersMap] = useState<Record<string, { name: string; zipCode: string }>>({});
  const [serviceRate, setServiceRate] = useState<number>(0);
  const currentCheckout = checkouts.length > 0 ? checkouts[0] : null;
  const items: CheckoutItem[] = currentCheckout?.items || [];
  const [fullItems, setFullItems] = useState<any[]>([]);
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
  const [isEditing, setIsEditing] = useState(false);

  const [rebuilding, setRebuilding] = useState(false);

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
      // 👉 强制类型 CheckoutItem
      const uniqueOwnerIds: string[] = Array.from(
        new Set(items.map((b: CheckoutItem) => b.ownerId))
      );

      const map: Record<string, { name: string; zipCode: string }> = {};

      for (const id of uniqueOwnerIds) {
        try {
          const u = await getUserById(id);
          map[id] = {
            name: [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Unknown Owner",
            zipCode: u?.zipCode || "6000",
          };
        } catch {
          map[id] = { name: id, zipCode: "0000" };
        }
      }

      setOwnersMap(map);
    }

    if (items.length > 0) loadOwners();
  }, [items]);


  // 3. 拉取 checkout，如果没有则创建
  useEffect(() => {
    async function initCheckout() {
      let data = await getMyCheckouts();
      if (!data || data.length === 0) {
        const payload = buildPayload(currentUser, null, [], {}, {});
        const created = await createCheckout(payload);
        data = [created];
      }
      setCheckouts(data);
    }

    if (currentUser) initCheckout();
  }, [currentUser]);

  // 4. 获取书本详情
  useEffect(() => {
    async function enrichItems() {
      if (!items.length) return;

      const results = await Promise.all(
        items.map(async (it) => {
          try {
            const book = await getBookById(it.bookId);
            return {
              ...it,
              titleOr: book?.titleOr,
              deliveryMethod: book?.deliveryMethod, // post / pickup / both
            };
          } catch (e) {
            console.error("Failed to fetch book:", it.bookId, e);
            return { ...it, titleOr: "Unknown Book", deliveryMethod: "" };
          }
        })
      );

      setFullItems(results);
    }

    enrichItems();
  }, [items]);
  // 5.获取service fee
  useEffect(() => {
    listServiceFees().then((fees) => {
      const activePercent = fees.find((f: any) => f.feeType === "PERCENT" && f.status);
      if (activePercent) setServiceRate(Number(activePercent.value));
    });
  }, []);

  // ---------- buildPayload ----------
  function buildPayload(
    user: User | null,
    checkout: any | null,
    items: any[],
    shipping: Record<string, "delivery" | "pickup">,
    selectedQuotes: Record<string, ShippingQuote>
  ) {
    return {
      userId: user?.id,
      contactName: checkout?.contactName ?? user?.name ?? "",
      phone: checkout?.phone ?? user?.phoneNumber ?? "",
      street: checkout?.street ?? user?.streetAddress ?? "",
      city: checkout?.city ?? user?.city ?? "",
      state: checkout?.state ?? user?.state ?? "",
      postcode: checkout?.postcode ?? user?.zipCode ?? "",
      country: "Australia",
      items: items.map((it) => {
        const quote = selectedQuotes[it.ownerId];
        return {
          bookId: it.bookId,
          ownerId: it.ownerId,
          actionType: it.actionType,
          price: it.price,
          deposit: it.deposit,
          shippingMethod: shipping[it.bookId] || it.shippingMethod || "",
          serviceCode: quote?.serviceLevel === "Express" ? "AUS_PARCEL_EXPRESS" : "AUS_PARCEL_REGULAR",
        };
      }),
    };
  }

  // ---------- rebuild checkout ----------
  const rebuildCheckout = async (
    newItemShipping: Record<string, "delivery" | "pickup">,
    selectedQuotes: Record<string, ShippingQuote> = {}
  ) => {
    if (!currentUser) return;
    try {
    setRebuilding(true);

    if (currentCheckout) {
      await deleteCheckout(currentCheckout.checkoutId);
    }
      const payload = buildPayload(currentUser, currentCheckout, fullItems, newItemShipping, selectedQuotes);
      const newCheckout = await createCheckout(payload);
      setCheckouts([newCheckout]);
    } catch (err) {
      console.error("Failed to rebuild checkout:", err);
      alert("Failed to update checkout, please try again.");
    }
  };

  // ---------- useEffect 初始化 shipping ----------
  useEffect(() => {
    if (!items.length) return;

    // 如果 itemShipping 已经初始化过，就不要再 set 了
    if (Object.keys(itemShipping).length > 0) return;

    const next: Record<string, "delivery" | "pickup" | ""> = {};
    for (const b of items) {
      next[b.bookId] = ""; // 默认空
    }
    setItemShipping(next);
  }, [items]); // ✅ 不会死循环


  // ---------- groups ----------
  const groups = useMemo(() => {
    const delivery: Record<string, typeof items> = {};
    const pickup: Record<string, typeof items> = {};
    for (const b of items) {
      const choice = itemShipping[b.bookId];
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
  }, [items, itemShipping]);

  // ---------- Get quotes per owner for DELIVERY items ----------
  async function requestQuotes() {
    if (!currentCheckout) return;
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
    const result: Record<string, ShippingQuote[]> = {};

    const deliveryGroups: Record<string, any[]> = {};
    for (const b of items) {
      if (itemShipping[b.bookId] === "delivery") {
        (deliveryGroups[b.ownerId] ||= []).push(b);
      }
    }

    for (const ownerId of Object.keys(deliveryGroups)) {
      const group = deliveryGroups[ownerId];
      const length = 30;
      const width = 20;
      const height = 5 * group.length;
      const weight = 0.5 * group.length;

      try {
        const data = await getShippingQuotes(
          ownersMap[ownerId]?.zipCode || "2000",
          String(currentCheckout.postcode || ""),
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
            cost: parseFloat(String(data.AUS_PARCEL_EXPRESS?.total_cost ?? "0")),
            currency: "AUD",
            etaDays: data.AUS_PARCEL_EXPRESS?.delivery_time || "-",
            expiresAt,
          },
        ];
      } catch (err) {
        console.error(`Failed to fetch quotes for ${ownerId}:`, err);
        result[ownerId] = [];
      }
    }
    setQuotesByOwner(result);
    // 默认选 Standard
    const sel: Record<string, ShippingQuote> = {};
    for (const k of Object.keys(result)) {
      if (result[k]?.length) {
        const std = result[k].find((q) => q.serviceLevel === "Standard");
        sel[k] = std || result[k][0];
      }
    }
    setSelectedQuoteByOwner(sel);
    setGlobalShippingChoice("standard");
  }

  // ---------- Handlers ----------
  const setChoice = (bookId: string, value: DeliveryChoice) => {
    setItemShipping(prev => {
      const next = { ...prev, [bookId]: value };
      return next;
    });
  };


  // ---------- Place Order ----------
  const placeOrder = async () => {
    if (!currentCheckout) {
      alert("No checkout found, please refresh.");
      return;
    }
    if (!currentCheckout.contactName || !currentCheckout.phone || !currentCheckout.street) {
      alert("Please complete your delivery address before placing the order.");
      return;
    }
    if (!currentCheckout.totalDue || currentCheckout.totalDue <= 0) {
      alert("Order total is invalid.");
      return;
    }
    alert(`Order placed! Total due: $${currentCheckout.totalDue}`);
    router.push(`/orders/${currentCheckout.checkoutId}`);
  };


  // ---------- When Empty ----------
  if (!items.length) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Please select at least one book to checkout.</h2>
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

            {isEditing ? (
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
                  const cleaned: Record<string, "delivery" | "pickup"> =
                    Object.fromEntries(
                      checkout.items.map((it: any) => [it.bookId, it.shippingMethod])
                    ) as Record<string, "delivery" | "pickup">;

                  await rebuildCheckout(cleaned);

                  setIsEditing(false); // 保存后回到只读模式
                  alert("Address saved!");
                }}
                className="text-sm"
              >
                Save
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="text-sm"
              >
                Edit
              </Button>
            )}
          </div>

          {checkouts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contact Name"
                value={checkouts[0].contactName || ""}
                disabled={!isEditing} // 👈 默认只读
                onChange={(e) =>
                  setCheckouts((prev) =>
                    prev.length ? [{ ...prev[0], contactName: e.target.value }] : prev
                  )
                }
              />
              <Input
                label="Phone"
                value={checkouts[0].phone || ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setCheckouts((prev) =>
                    prev.length ? [{ ...prev[0], phone: e.target.value }] : prev
                  )
                }
              />
              <Input
                label="Street"
                value={checkouts[0].street || ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setCheckouts((prev) =>
                    prev.length ? [{ ...prev[0], street: e.target.value }] : prev
                  )
                }
              />
              <Input
                label="City"
                value={checkouts[0].city || ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setCheckouts((prev) =>
                    prev.length ? [{ ...prev[0], city: e.target.value }] : prev
                  )
                }
              />
              <Input
                label="State"
                value={checkouts[0].state || ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setCheckouts((prev) =>
                    prev.length ? [{ ...prev[0], state: e.target.value }] : prev
                  )
                }
              />
              <Input
                label="Postcode"
                value={checkouts[0].postcode || ""}
                disabled={!isEditing}
                onChange={(e) =>
                  setCheckouts((prev) =>
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
                const unselected = items.filter((b) => !itemShipping[b.bookId]);
                if (unselected.length > 0) {
                  alert("Please select delivery method for all items before saving.");
                  return;
                }

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

          {/* Items group */}
          <div className="space-y-4">
            {Object.entries(
              fullItems.reduce<Record<string, typeof fullItems[number][]>>((acc, item) => {
                (acc[item.ownerId] ||= []).push(item);
                return acc;
              }, {})
            ).map(([ownerId, ownerItems]) => (
              <div key={ownerId} className="border rounded-md p-4 space-y-3 bg-gray-100">
                <div className="font-semibold">📚 Owner: {ownersMap[ownerId]?.name}</div>
                <div className="divide-y space-y-2">
                  {ownerItems.map((b: CheckoutItem) => (
                    <div key={b.bookId} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            《{b.titleOr}》
                            <span className="text-sm text-blue-600">
                              Trading Way: {b.actionType === "BORROW" ? "Borrow" : "Purchase"}
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
                              value={itemShipping[b.bookId]}
                              onChange={(e) =>
                                setChoice(b.bookId, e.target.value as "delivery" | "pickup")
                              }
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
                      {itemShipping[b.bookId] === "pickup" && (
                        <p className="text-sm text-green-700 mt-2">
                          Pickup is free. Details will be shared after order.
                        </p>
                      )}

                      {/* Shipping Quotes（if chose delivery, display under this owner） */}
                      {ownerItems.some((b) => itemShipping[b.bookId] === "delivery") &&
                        quotesByOwner[ownerId]?.length > 0 && (
                          <div className="mt-4 p-4 rounded-md border bg-white">
                            <h4 className="text-sm font-semibold mb-2 text-gray-800">
                              AusPost Shipping Quotes
                            </h4>
                            <div className="flex gap-2">
                              {quotesByOwner[ownerId].map((q) => {
                                const choiceKey = q.serviceLevel === "Standard" ? "standard" : "express";
                                return (
                                  <button
                                    key={q.id}
                                    type="button"
                                    onClick={async () => {
                                      setGlobalShippingChoice(choiceKey);

                                      // 记录选中的报价
                                      setSelectedQuoteByOwner((prev) => ({
                                        ...prev,
                                        [ownerId]: q,
                                      }));

                                      // rebuild checkout 这里要用 fullItems + itemShipping
                                      const cleaned: Record<string, "delivery" | "pickup"> =
                                        Object.fromEntries(
                                          fullItems.map((it) => [it.bookId, itemShipping[it.bookId]])
                                        ) as Record<string, "delivery" | "pickup">;

                                      await rebuildCheckout(cleaned);
                                    }}
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
