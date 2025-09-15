// My borrowing books
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Package, Clock, AlertTriangle, MessageSquare, FileText } from "lucide-react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

import type { Order, OrderStatus } from "@/app/types/order";
import type { Book } from "@/app/types/book";
import { mockOrders, mockBooks, mockUsers, getCurrentUser } from "@/app/data/mockData";

//import { getOrders, updateOrder, cancelOrder } from "@/utils/orders";
import { getBookById } from "@/utils/books";

type ComplaintType = "book-condition" | "delivery" | "user-behavior" | "other";

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
  const [complaintForm, setComplaintForm] = useState({
    type: "book-condition" as ComplaintType,
    subject: "",
    description: ""
  });
  const router = useRouter();

  const currentUser = getCurrentUser();

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

  // 暂时直接用 mock 数据
  useEffect(() => {
    setOrders(mockOrders);

    const map: Record<string, Book> = {};
    for (const b of mockBooks) map[b.id] = b;
    setBooksMap(map);
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
                  const ownerName = mockUsers.find(u => u.id === o.ownerId)?.name || "Unknown Owner";

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

                          {/* Report Issue - Available for active orders */}
                          {(o.status === "BORROWING" || o.status === "OVERDUE" || o.status === "RETURNED") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white"
                              onClick={() => {
                                setSelectedOrder(o);
                                setComplaintForm({
                                  type: "book-condition",
                                  subject: "",
                                  description: ""
                                });
                                setIsComplaintModalOpen(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Report Issue
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
      <Modal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        title="Report an Issue"
      >
        <div className="space-y-4">
          {selectedOrder && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Order Information</h4>
              <div className="text-sm text-blue-800">
                <p>Order ID: {selectedOrder.id}</p>
                <p>Status: {STATUS_META[selectedOrder.status].label}</p>
                {(() => {
                  const book = selectedOrder.bookIds.map(id => booksMap[id]).filter(Boolean)[0];
                  return book ? <p>Book: {book.titleOr}</p> : null;
                })()}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type
            </label>
            <select
              value={complaintForm.type}
              onChange={(e) => setComplaintForm({...complaintForm, type: e.target.value as ComplaintType})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="book-condition">Book Damaged</option>
              <option value="delivery">Wrong Book Received</option>
              <option value="user-behavior">Poor Book Condition</option>
              <option value="other">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={complaintForm.subject}
              onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
              placeholder="Brief description of the issue"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description
            </label>
            <textarea
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({...complaintForm, description: e.target.value})}
              placeholder="Please provide detailed information about the issue. Include any relevant details that will help us resolve the problem."
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Important Note</h4>
                <p className="text-yellow-800 text-sm">
                  This complaint will be reviewed by our admin team. Please provide accurate information 
                  as false reports may result in account restrictions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsComplaintModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComplaint}
              disabled={!complaintForm.subject.trim() || !complaintForm.description.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );

  function handleSubmitComplaint() {
    if (!selectedOrder || !complaintForm.subject.trim() || !complaintForm.description.trim()) {
      return;
    }

    // Here you would typically send the complaint to your backend
    console.log("Submitting order complaint:", {
      orderId: selectedOrder.id,
      type: complaintForm.type,
      subject: complaintForm.subject,
      description: complaintForm.description,
      source: "order"
    });

    // Show success message
    alert("Your complaint has been submitted successfully! You can track its progress in the Complaints page.");

    // Reset and close
    setComplaintForm({
      type: "book-condition",
      subject: "",
      description: ""
    });
    setSelectedOrder(null);
    setIsComplaintModalOpen(false);

    // Optionally redirect to complaints page
    router.push("/complain");
  }
}
