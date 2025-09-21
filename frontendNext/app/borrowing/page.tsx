// My borrowing books
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Package, Clock, AlertTriangle } from "lucide-react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import type { Book } from "@/app/types/book";
import { getCurrentUser, getUserById } from "@/utils/auth";
import { getBorrowingOrders, type Order } from "@/utils/orders";
import { getBookById } from "@/utils/books";
import { createComplaint, type CreateComplaintRequest } from "@/utils/complaints";

// Use Order status from utils/orders.ts
type OrderStatus = Order["status"];

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "text-amber-600" },
  PENDING_SHIPMENT: { label: "Pending Shipment", className: "text-blue-600" },
  BORROWING: { label: "Borrowing", className: "text-green-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
  RETURNED: { label: "Returned", className: "text-gray-700" },
  COMPLETED: { label: "Completed", className: "text-gray-500" },
  CANCELED: { label: "Canceled", className: "text-gray-400" },
};

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [booksMap, setBooksMap] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [complaintType, setComplaintType] = useState<"book-condition" | "delivery" | "user-behavior" | "overdue" | "other">("book-condition");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  const router = useRouter();

  // // get borrowing orders & related books
  //  useEffect(() => {
  //   let alive = true;
  //   (async () => {
  //     const user = await getCurrentUser();
  //     if (!user) return;

  //     const list = await getOrders(user.id);
  //     if (!alive) return;
  //     setOrders(list);

  // get books info
  // const ids = Array.from(new Set(orders.flatMap(o => o.bookIds))); 
  // if (ids.length) {
  //   const books = await getBooksByIds(ids);
  //   const map: Record<string, Book> = {};
  //   for (const b of books) map[b.id] = b;
  //   setBooksMap(map);
  // }
  //   })();
  //   return () => {
  //     alive = false;
  //   };
  // }, []);

  // Load borrowing orders (checkouts) 
  useEffect(() => {
    const loadData = async () => {
      try {
        const orders = await getBorrowingOrders();
        setOrders(orders);
        
        const booksMapping: Record<string, Book> = {};
        for (const order of orders) {
          for (const bookId of order.bookIds) {
            try {
              const book = await getBookById(bookId);
              if (book) {
                booksMapping[bookId] = book;
              }
            } catch (error) {
              console.error(`Failed to load book ${bookId}:`, error);
            }
          }
        }
        setBooksMap(booksMapping);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // search and filter
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        const booksInOrder = o.bookIds.map((id) => booksMap[id]).filter(Boolean) as Book[];

        const bookMatched = booksInOrder.some((b) =>
          (b.titleOr || "").toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q)
        );

        return bookMatched || o.id.toLowerCase().includes(q);
      });
    }
    return list;
  }, [orders, statusFilter, search, booksMap]);


  const countBy = (s: OrderStatus) => orders.filter(o => o.status === s).length;

  const filterOptions = [
    { value: "PENDING_PAYMENT", label: "Pending Payment", count: countBy("PENDING_PAYMENT") },
    { value: "PENDING_SHIPMENT", label: "Pending Shipment", count: countBy("PENDING_SHIPMENT") },
    { value: "BORROWING", label: "Borrowing", count: countBy("BORROWING") },
    { value: "OVERDUE", label: "Overdue", count: countBy("OVERDUE") },
    { value: "RETURNED", label: "Returned", count: countBy("RETURNED") },
    { value: "COMPLETED", label: "Completed", count: countBy("COMPLETED") },
    { value: "CANCELED", label: "Canceled", count: countBy("CANCELED") },
    { value: "all", label: "All", count: orders.length },
  ] as const;

  // formed time
  const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString() : "—");

  const isActionable = (o: Order) =>
    o.status === "PENDING_SHIPMENT" || o.status === "BORROWING" || o.status === "RETURNED" || o.status === "OVERDUE";


  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
              <p className="text-gray-600">View and manage your borrowing orders</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by book title, author, or order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  onClick={() => setStatusFilter(option.value as any)}
                  className={`flex items-center gap-2 ${statusFilter === option.value ? "bg-black text-white hover:bg-gray-800 border-black" : ""
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  {option.label}
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{option.count}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Error / Loading */}
          {err && (
            <Card>
              <div className="p-4 text-red-600">{err}</div>
            </Card>
          )}
          {loading && (
            <Card>
              <div className="p-4 text-gray-600">Loading orders...</div>
            </Card>
          )}

          {/* Order list */}
          {!loading && !err && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500">Try adjusting filters or search terms</p>
                  </div>
                </Card>
              ) : (
                filteredOrders.map((o) => {
                  const booksInOrder = o.bookIds.map((id) => booksMap[id]).filter(Boolean) as Book[];
                  const first = booksInOrder[0];
                  const ownerName = "Book Owner"; // TODO: Fetch owner name from API

                  const extra = Math.max(0, booksInOrder.length - 1);

                  const meta = STATUS_META[o.status];
                  const isOverdueBadge =
                    o.status === "BORROWING" && o.dueAt && new Date(o.dueAt).getTime() < Date.now();

                  return (
                    <Card key={o.id} className="relative overflow-visible flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition">
                      {/* Covers: up to 5 thumbnails; if >5, overlay "+X more" on the last */}
                      {(() => {
                        const booksInOrder = o.bookIds.map(id => booksMap[id]).filter(Boolean) as Book[];
                        const thumbs = booksInOrder.slice(0, 5);
                        const extra = Math.max(0, booksInOrder.length - 5);

                        return (
                          <div className="relative w-28 h-36 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {first?.coverImgUrl ? (
                              <img src={first.coverImgUrl} alt={first.titleOr} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No Cover
                              </div>
                            )}
                            {extra > 0 && (
                              <span className="absolute bottom-1 right-1 rounded bg-black/80 text-white text-[10px] px-1.5 py-0.5">
                                +{extra}
                              </span>
                            )}
                          </div>
                        );
                      })()}


                      {/* Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            {/* title*/}
                            <div>
                            <h3
                              className="text-lg font-semibold text-black cursor-pointer hover:underline"
                              onClick={() => router.push(`/borrowing/${o.id}`)}
                              title={booksInOrder.map(b => b?.titleOr).filter(Boolean).join(" · ")}
                            >
                              {first?.titleOr || "Untitled Book"}
                              {extra > 0 && <span className="text-gray-500"> + {extra} more</span>}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Owner: <span className="font-medium">{ownerName}</span>
                            </p>
                            </div>

                            {/* statuss */}
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-medium ${meta.className}`}>{meta.label}</span>

                            </div>
                          </div>


                          {/* times */}
                          <div className="text-sm text-gray-500 mt-1 flex flex-col gap-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span>Created: {fmtDate(o.createdAt)}</span>
                            </div>
                            {o.dueAt && (
                              <div className="flex text-black font-medium items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>Due: {fmtDate(o.dueAt)}</span>
                                {isOverdueBadge && (
                                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                                    <AlertTriangle className="w-4 h-4" /> Overdue
                                  </span>
                                )}
                              </div>
                            )}

                          </div>
                        </div>

                        {/* actions */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-black text-black hover:bg-black hover:text-white"
                            onClick={() => router.push(`/borrowing/${o.id}`)}
                          >
                            View Detail
                          </Button>

                          {/* Message */}
                          {o.status !== "COMPLETED" && o.status !== "CANCELED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-black text-black hover:bg-black hover:text-white"
                              onClick={() => router.push(`/messages?orderId=${o.id}`)}
                            >
                              Message Owner
                            </Button>
                          )}

                          {/* Create Complaint */}
                          {(o.status === "BORROWING" || o.status === "OVERDUE" || o.status === "RETURNED") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white"
                              onClick={() => {
                                setSelectedOrder(o);
                                setIsComplaintModalOpen(true);
                              }}
                            >
                              Create Complaint
                            </Button>
                          )}

                        </div>
                      </div>
                    </Card>
                  );
                })
              )
              }


            </div>
          )}
        </div>
      </div>

      {/* Complaint Modal */}
      {isComplaintModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create Complaint - Order #{selectedOrder.id}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Complaint Type</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value as "book-condition" | "delivery" | "user-behavior" | "overdue" | "other")}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="book-condition">Book Condition</option>
                  <option value="delivery">Delivery Issue</option>
                  <option value="user-behavior">User Behavior</option>
                  <option value="overdue">Overdue Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsComplaintModalOpen(false);
                  setSelectedOrder(null);
                  setComplaintDescription("");
                  setComplaintType("book-condition");
                }}
                disabled={isSubmittingComplaint}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!complaintDescription.trim()) return;
                  
                  setIsSubmittingComplaint(true);
                  try {
                    const user = await getCurrentUser();
                    if (!user) throw new Error("User not authenticated");

                    const complaintData: CreateComplaintRequest = {
                      subject: `Complaint for Order ${selectedOrder?.id}`,
                      orderId: selectedOrder?.id || "",
                      type: complaintType,
                      description: complaintDescription.trim(),
                      source: "order",
                    };

                    await createComplaint(complaintData);
                    
                    // Close modal and reset form
                    setIsComplaintModalOpen(false);
                    setSelectedOrder(null);
                    setComplaintDescription("");
                    setComplaintType("book-condition");
                    
                    // Show success message (you might want to add a toast notification here)
                    alert("Complaint submitted successfully!");
                  } catch (error) {
                    console.error("Failed to create complaint:", error);
                    alert("Failed to submit complaint. Please try again.");
                  } finally {
                    setIsSubmittingComplaint(false);
                  }
                }}
                disabled={!complaintDescription.trim() || isSubmittingComplaint}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isSubmittingComplaint ? "Submitting..." : "Submit Complaint"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
