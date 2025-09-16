"use client";

import { useMemo, useState, useEffect } from "react";
import { ShoppingBag, Trash2, CheckSquare, Square } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useCartStore } from "@/app/store/cartStore";
import { useRouter } from "next/navigation";
import { getUserById } from "@/utils/auth";
import type { User } from "@/app/types/user";


export default function CartPage() {
  const { cart, loading, fetchCart, removeFromCart, setMode } = useCartStore();
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();
  const [ownersMap, setOwnersMap] = useState<Record<string, User>>({});


  // Pull the backend shopping cart then owner Info
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // useEffect：listen cart，then load owner Info
  useEffect(() => {
    const loadOwners = async () => {
      const uniqueOwnerIds = Array.from(new Set(cart.map((b) => b.ownerId).filter(Boolean)));
      const map: Record<string, User> = {};

      for (const id of uniqueOwnerIds) {
        const u = await getUserById(id);
        if (u) map[id] = u;
      }

      setOwnersMap(map);
    };

    if (cart.length > 0) {
      loadOwners();
    }
  }, [cart]);



  // delete confirm
  const handleConfirmRemove = async () => {
    try {
      await removeFromCart(selectedIds); // recall cartStore，use api upload local
      setSelectedIds([]);
      setIsRemoveMode(false);
    } catch (err) {
      console.error("Failed to remove items:", err);
    }
  };

  // select by one item
  const toggleSelect = (cartItemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(cartItemId) ? prev.filter((id) => id !== cartItemId) : [...prev, cartItemId]
    );
  };

  // select by owner group
  const toggleSelectGroup = (ownerId: string) => {
    // 用 cartItemId，而不是 book.id
    const ids = (groupedByOwner.groups[ownerId] || []).map((b) => b.cartItemId);

    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));

      if (allSelected) {
        // 如果已经全选，则取消这一组
        return prev.filter((id) => !ids.includes(id));
      } else {
        // 否则加入未选中的
        return Array.from(new Set([...prev, ...ids]));
      }
    });
  };


  // select all
  const toggleSelectAll = () => {
    const allIds = cart.map((b) => b.cartItemId);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  };

  // —— price without shipping fee —— //
  const displayUnitPrice = (item: any) => {
    if (item.mode === "purchase") {
      return Number(item.salePrice ?? 0);
    }
    return Number(item.deposit ?? 0); // borrow
  };

  const lineSubtotal = (item: any) => displayUnitPrice(item);

  // Group by ownerId
  const groupedByOwner = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const book of cart) {
      const key = book.ownerId || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(book);
    }
    const orderedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unknown") return 1;
      if (b === "Unknown") return -1;
      return a.localeCompare(b);
    });
    return { groups, orderedKeys };
  }, [cart]);

  // total price for every owner
  const ownerSummaries = useMemo(() => {
    const map = new Map<string, { count: number; subtotal: number }>();
    for (const ownerId of groupedByOwner.orderedKeys) {
      const items = groupedByOwner.groups[ownerId];
      const subtotal = items.reduce((sum, it) => sum + lineSubtotal(it), 0);
      map.set(ownerId, { count: items.length, subtotal });
    }
    return map;
  }, [groupedByOwner]);

  // totals
  const { totalCount, totalPrice } = useMemo(() => {
    const totalCount = cart.length;
    const totalPrice = cart.reduce((sum, it) => sum + lineSubtotal(it), 0);
    return { totalCount, totalPrice };
  }, [cart]);

  const { selectedCount, selectedPrice } = useMemo(() => {
    const set = new Set(selectedIds);
    let count = 0;
    let sum = 0;
    for (const it of cart) {
      if (set.has(it.id)) {
        count += 1;
        sum += lineSubtotal(it);
      }
    }
    return { selectedCount: count, selectedPrice: sum };
  }, [selectedIds, cart]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading cart...</div>;
  }

  const cartEmpty = cart.length === 0;



  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Cart</h1>
              <p className="text-gray-600">Books you plan to borrow or purchase</p>
            </div>

            {!cartEmpty && (
              <div className="flex items-center gap-2">
                {isRemoveMode && (
                  <Button variant="outline" onClick={toggleSelectAll} className="flex items-center gap-2">
                    {cart.length > 0 && cart.every((b) => selectedIds.includes(b.id)) ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {cart.length > 0 && cart.every((b) => selectedIds.includes(b.id)) ? "Unselect all" : "Select all"}
                  </Button>
                )}

                {isRemoveMode ? (
                  <>
                    <Button variant="outline" onClick={handleConfirmRemove} className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsRemoveMode(false);
                        setSelectedIds([]);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setIsRemoveMode(true)} className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Cart list */}
          <div className="space-y-6">
            {cartEmpty ? (
              <Card>
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-4">Start adding books to borrow or purchase!</p>
                </div>
              </Card>
            ) : (
              groupedByOwner.orderedKeys.map((ownerId) => {
                const books = groupedByOwner.groups[ownerId];
                const summary = ownerSummaries.get(ownerId)!;
                const ownerName = ownersMap[ownerId]?.name || "Unknown Owner";

                return (
                  <section key={ownerId} className="space-y-4">
                    {/* Group Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">
                        Owner: <span className="font-semibold">{ownerName}</span>
                        <span className="ml-3 text-sm text-gray-500">
                          ({summary.count} item{summary.count > 1 ? "s" : ""})
                        </span>
                      </h2>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Subtotal: </span>
                          <span style={{ color: "#FF6801" }}>${summary.subtotal.toFixed(2)}</span>
                        </div>
                        {isRemoveMode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectGroup(ownerId)}
                            className="flex items-center gap-2"
                          >
                            {(groupedByOwner.groups[ownerId] || [])
                              .map((b) => b.cartItemId)
                              .every((id) => selectedIds.includes(id)) ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                            {(groupedByOwner.groups[ownerId] || [])
                              .map((b) => b.cartItemId)
                              .every((id) => selectedIds.includes(id))
                              ? "Unselect"
                              : "Select"}
                          </Button>
                        )}
                      </div>

                    </div>

                    {books.map((book) => (
                      <Card key={book.cartItemId}>
                        <div className="space-y-3 relative">
                          {/* multiple select box */}
                          {isRemoveMode && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(book.cartItemId)}
                              onChange={() => toggleSelect(book.cartItemId)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            />
                          )}

                          {/* Title + Toggle */}
                          <div className="flex justify-between items-start pl-6">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">《{book.titleOr}》</h3>
                            </div>

                            {/* Borrow / Purchase switch */}
                            <div className="flex border rounded-lg overflow-hidden text-sm font-medium">
                              {book.canRent && (
                                <button
                                  onClick={() => setMode(book.id, "borrow")}
                                  className={`px-4 py-1 ${book.mode === "borrow"
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                  Borrow
                                </button>
                              )}
                              {book.canSell && (
                                <button
                                  onClick={() => setMode(book.id, "purchase")}
                                  className={`px-4 py-1 ${book.mode === "purchase"
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                  Purchase
                                </button>
                              )}
                            </div>
                          </div>

                          {/* book info */}
                          <div className="flex pl-10 items-start gap-4">

                            {/* cover page */}
                            <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {book.coverImgUrl ? (
                                <img
                                  src={book.coverImgUrl}
                                  alt={book.titleOr}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Cover
                                </div>
                              )}
                            </div>
                            {/* other info */}
                            <div className="flex flex-col justify-between flex-1">

                              <div className="space-y-2 text-sm text-gray-700 pl-6">
                                {book.author && (
                                  <div>
                                    <span className="font-medium">Author:&nbsp;</span>
                                    {book.author}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Status:&nbsp;</span>
                                  {book.status === "listed"
                                    ? "Listed"
                                    : book.status
                                      ? book.status
                                      : "Unlisted"}
                                </div>
                                {/* <div>
                                  <span className="font-medium">Shipping Method:&nbsp;</span>
                                  {book.deliveryMethod || "N/A"}
                                </div> */}

                              </div>

                              {/* Price（right） */}
                              <div className="flex justify-end items-center gap-2 pr-1">
                                <span className="text-sm text-gray-600">Price:</span>
                                <span className="text-lg font-semibold" style={{ color: "#FF6801" }}>
                                  ${displayUnitPrice(book).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </section>
                );
              })
            )}
          </div>

          {/* Total Footer */}
          {!cartEmpty && (
            <div className="w-full mt-12">
              <div className="max-w-6xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Info */}
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span>({isRemoveMode ? selectedCount : totalCount} items)</span>
                    <span className="font-medium">:</span>
                    <span className="text-xl font-bold" style={{ color: "#FF6801" }}>
                      ${(isRemoveMode ? selectedPrice : totalPrice).toFixed(2)}
                    </span>
                    {isRemoveMode && <span className="ml-2 text-gray-500">(selected)</span>}
                  </div>



                  {/* Buttons */}
                  <div className="flex gap-2">
                    {!isRemoveMode ? (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/checkout")}
                      >
                        Proceed to Checkout
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsRemoveMode(false)}
                      >
                        Exit Remove Mode
                      </Button>
                    )}

                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  * Shipping costs will be calculated at checkout based on your selected delivery method.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
