// books borrowed history list
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle, ArrowLeft } from "lucide-react";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

import type { Order } from "@/app/types/order";
import type { Book } from "@/app/types/book";
import { mockOrders, mockBooks, mockUsers } from "@/app/data/mockData";

const STATUS_META = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "text-amber-600" },
  PENDING_SHIPMENT: { label: "Pending Shipment", className: "text-blue-600" },
  BORROWING: { label: "Borrowing", className: "text-green-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
  RETURNED: { label: "Returned", className: "text-gray-700" },
  COMPLETED: { label: "Completed", className: "text-gray-500" },
  CANCELED: { label: "Canceled", className: "text-gray-400" },
} as const;

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString() : "—");

export default function BorrowHistoryPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    // find this book
    const b = mockBooks.find((x) => x.id === bookId) || null;
    setBook(b);

    // find all history orders about this book
    const relatedOrders = mockOrders.filter((o) => o.bookIds.includes(bookId));
    setOrders(relatedOrders);
  }, [bookId]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* title */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Borrowing History – {book?.titleOr || "Untitled Book"}
        </h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <div className="p-6 text-gray-600">No borrowing history found.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const ownerName = mockUsers.find((u) => u.id === o.ownerId)?.name || "Unknown Owner";
            const meta = STATUS_META[o.status];
            const isOverdueBadge =
              o.status === "BORROWING" && o.dueAt && new Date(o.dueAt).getTime() < Date.now();

            return (
              <Card
                key={o.id}
                className="flex flex-col md:flex-row gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition"
              >
                {/* 时间 & 状态 */}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Borrower:{" "}
                    <span className="font-medium">
                      {mockUsers.find((u) => u.id === o.borrowerId)?.name || "Unknown Borrower"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Owner: <span className="font-medium">{ownerName}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Created: <span className="font-medium">{fmtDate(o.createdAt)}</span>
                  </p>
                  {o.startAt && (
                    <p className="text-sm text-gray-600">
                      Start: <span className="font-medium">{fmtDate(o.startAt)}</span>
                    </p>
                  )}
                  {o.dueAt && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Due: <span className="font-medium">{fmtDate(o.dueAt)}</span>
                      {isOverdueBadge && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle className="w-4 h-4" /> Overdue
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* 状态 */}
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
