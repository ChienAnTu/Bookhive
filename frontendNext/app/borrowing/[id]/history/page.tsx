// books borrowed history list
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle, ArrowLeft, Package, DollarSign, User as UserIcon } from "lucide-react";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

import type { Book } from "@/app/types/book";
import { getOrdersByBookId } from "@/utils/borrowingOrders";
import { getBookById } from "@/utils/books";
import { getUserById } from "@/utils/auth";
import type { Order as ApiOrder } from "@/utils/borrowingOrders";

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "text-amber-600" },
  PENDING_SHIPMENT: { label: "Pending Shipment", className: "text-blue-600" },
  BORROWING: { label: "Borrowing", className: "text-green-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
  RETURNED: { label: "Returned", className: "text-gray-700" },
  COMPLETED: { label: "Completed", className: "text-gray-500" },
  CANCELED: { label: "Canceled", className: "text-gray-400" },
};

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString() : "—");

export default function BorrowHistoryPage() {
  const params = useParams();
  const bookId = params?.id as string;
  const router = useRouter();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersCache, setUsersCache] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch book details
        const bookData = await getBookById(bookId);
        setBook(bookData);

        // Fetch orders for this book
        const ordersData = await getOrdersByBookId(bookId);
        setOrders(ordersData);

        // Fetch user details for all unique user IDs in orders
        const userIds = new Set<string>();
        ordersData.forEach(order => {
          if (order.borrower_id) userIds.add(order.borrower_id);
          if (order.owner_id) userIds.add(order.owner_id);
        });

        // Fetch all users in parallel
        const userPromises = Array.from(userIds).map(id => getUserById(id));
        const users = await Promise.all(userPromises);

        // Build users cache
        const cache: Record<string, any> = {};
        users.forEach(user => {
          if (user) cache[user.id] = user;
        });
        setUsersCache(cache);

      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      loadData();
    }
  }, [bookId]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Order History – {book?.titleOr || "Loading..."}
        </h1>
      </div>

      {loading ? (
        <Card>
          <div className="p-6 text-gray-600">Loading order history...</div>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No order history</h3>
            <p className="text-gray-500">This book has no borrowing or purchase orders yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = STATUS_META[order.status] || {
              label: order.status,
              className: "text-gray-600"
            };
            const isOverdue =
              order.status === "BORROWING" &&
              order.due_at &&
              new Date(order.due_at).getTime() < Date.now();

            return (
              <Card
                key={order.order_id}
                className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
                onClick={() => router.push(`/borrowing/${order.order_id}`)}
              >
                <div className="flex-1 space-y-2">
                  {/* Order ID */}
                  <p className="text-sm font-mono text-gray-500">
                    Order #{order.order_id.slice(0, 8)}
                  </p>

                  {/* Borrower Info */}
                  {usersCache[order.borrower_id] && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Borrowed by:{" "}
                        <span className="font-medium">
                          {usersCache[order.borrower_id].name ||
                           usersCache[order.borrower_id].username ||
                           "Unknown User"}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Books in order */}
                  <div className="flex flex-wrap gap-2">
                    {order.books.map((book, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {book.title}
                      </span>
                    ))}
                  </div>

                  {/* Order info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <p className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Created: {fmtDate(order.create_at)}
                    </p>
                    {/* Show completed date for completed orders, otherwise show due date */}
                    {order.status === "COMPLETED" && order.completed_at ? (
                      <p className="flex items-center gap-1 text-green-600 font-medium">
                        <Clock className="w-4 h-4" />
                        Completed: {fmtDate(order.completed_at)}
                      </p>
                    ) : order.due_at ? (
                      <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due: {fmtDate(order.due_at)}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 ml-1">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-end">
                  <span className={`text-base font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
