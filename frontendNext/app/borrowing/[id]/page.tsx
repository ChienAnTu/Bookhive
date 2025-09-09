// borrowingg orders detail
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Truck, ArrowLeft, AlertTriangle } from "lucide-react";

import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

import type { Order, OrderStatus } from "@/app/types/order";
import type { Book } from "@/app/types/book";
import BookThumbnailCard from "@/app/components/common/BookThumbnailCard";
import { mockOrders, mockBooks } from "@/app/data/mockData";
import { getBookById } from "@/utils/books";

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "text-amber-600" },
  PENDING_SHIPMENT: { label: "Pending Shipment", className: "text-blue-600" },
  BORROWING: { label: "Borrowing", className: "text-green-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
  RETURNED: { label: "Returned", className: "text-gray-700" },
  COMPLETED: { label: "Completed", className: "text-gray-500" },
  CANCELED: { label: "Canceled", className: "text-gray-400" },
};

// cents → AUD 字符串
const fmtAUD = (cents?: { amount: number }) =>
  typeof cents?.amount === "number" ? `A$ ${(cents.amount / 100).toFixed(2)}` : "—";

// form time
const fmtDate = (v?: string) => (v ? new Date(v).toLocaleString() : "—");

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [booksMap, setBooksMap] = useState<Record<string, Book>>({});

  // 加载 mock 数据
  useEffect(() => {
    const o = mockOrders.find((x) => x.id === id) || null;
    setOrder(o);

    const map: Record<string, Book> = {};
    for (const b of mockBooks) map[b.id] = b;
    setBooksMap(map);
  }, [id]);

  const statusMeta = useMemo(
    () => (order ? STATUS_META[order.status] : null),
    [order]
  );

  const booksInOrder = useMemo(
    () => (order ? order.bookIds.map((bid) => booksMap[bid]).filter(Boolean) as Book[] : []),
    [order, booksMap]
  );

  const isOverdue =
    !!order &&
    (order.status === "BORROWING" || order.status === "OVERDUE") &&
    !!order.dueAt &&
    new Date(order.dueAt).getTime() < Date.now();



  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="outline"
          className="mb-4 border-black text-black hover:bg-black hover:text-white"
          onClick={() => router.push("/borrowing")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Button>
        <Card><div className="p-6">Order not found.</div></Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      {/* Order ID + Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {statusMeta && (
            <p className={`mt-1 text-2xl font-bold ${statusMeta.className}`}>
              {statusMeta.label}
            </p>
          )}
        </div>
      </div>

      {/* Section 1 — Order Info */}
      <div className="grid md:grid-cols-2 gap-4">

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Order Info</h2>

          {/* Created/Start Date；Due date */}
          <div className="text-sm text-gray-500 mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-medium">Created: {fmtDate(order.createdAt)}</span>
              {order.startAt && <span className="font-medium">Start: {fmtDate(order.startAt)}</span>}
            </div>
            {order.dueAt && (
              <div className="flex text-black font-medium items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Due: {fmtDate(order.dueAt)}</span>
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                    <AlertTriangle className="w-4 h-4" /> Overdue
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* shipping: tracking info + Redirect to third-party delivery services */}
        <Card>
          <h2 className="text-lg font-semibold mb-3">Shipping Info</h2>

          <div className="mt-3 text-sm">
            <div>Delivery Method: <span className="font-medium">{order.deliveryMethod}</span></div>
            {(order.shippingOut?.trackingNumber || order.shippingReturn?.trackingNumber) && (
              <div className="mt-2 text-gray-700 flex items-center gap-6 flex-wrap">
                {order.shippingOut?.trackingNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Outbound:&nbsp;
                    {order.shippingOut?.trackingUrl ? (
                      <a className="underline" href={order.shippingOut.trackingUrl} target="_blank" rel="noreferrer">
                        {order.shippingOut.trackingNumber}
                      </a>
                    ) : (
                      order.shippingOut.trackingNumber
                    )}
                  </span>
                )}
                {order.shippingReturn?.trackingNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Return:&nbsp;
                    {order.shippingReturn?.trackingUrl ? (
                      <a className="underline" href={order.shippingReturn.trackingUrl} target="_blank" rel="noreferrer">
                        {order.shippingReturn.trackingNumber}
                      </a>
                    ) : (
                      order.shippingReturn.trackingNumber
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Section 2 — Books in this order */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Books in this order</h2>
        {booksInOrder.length === 0 ? (
          <div className="text-sm text-gray-600">No books found.</div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {booksInOrder.map((b) => (
              <BookThumbnailCard key={b.id} book={b} />
            ))}
          </div>
        )}
      </Card>

      {/* Section 3 - Price details + Settlement */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">Pricing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Deposit</span>
              <span className="font-medium">{fmtAUD(order.deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span className="font-medium">{fmtAUD(order.serviceFee)}</span>
            </div>
            {order.shippingOutFee?.amount ? (
              <div className="flex justify-between">
                <span>Outbound Shipping</span>
                <span className="font-medium">{fmtAUD(order.shippingOutFee)}</span>
              </div>
            ) : null}
            {order.salePrice?.amount ? (
              <div className="flex justify-between">
                <span>Sale Price</span>
                <span className="font-medium">{fmtAUD(order.salePrice)}</span>
              </div>
            ) : null}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between text-sm">
            <span>Total Paid</span>
            <span className="font-semibold text-black">{fmtAUD(order.totalPaid)}</span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">Settlement</h3>
          <div className="space-y-2 text-sm">
            {order.lateFee?.amount ? (
              <div className="flex justify-between">
                <span>Late Fee</span>
                <span className="font-medium">{fmtAUD(order.lateFee)}</span>
              </div>
            ) : null}
            {order.damageFee?.amount ? (
              <div className="flex justify-between">
                <span>Damage Fee</span>
                <span className="font-medium">{fmtAUD(order.damageFee)}</span>
              </div>
            ) : null}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between text-sm">
            <span>Total Refunded</span>
            <span className="font-semibold text-black">{fmtAUD(order.totalRefunded)}</span>
          </div>
        </Card>
      </div>

      {/* Section 4 — Action */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Actions</h3>
        <div className="flex flex-wrap gap-2">

          {/* Message Owner */}
          {order.status !== "COMPLETED" && order.status !== "CANCELED" && (
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={() => router.push(`/messages?orderId=${order.id}`)}
            >
              Message Owner
            </Button>
          )}

          {/* Pay Now */}
          {order.status === "PENDING_PAYMENT" && (
            <Button className="bg-black text-white hover:bg-gray-800" onClick={() => alert("TODO: Pay flow")}>
              Pay Now
            </Button>
          )}

          {/* Add Tracking */}
          {order.status === "PENDING_SHIPMENT" && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push(`/orders/${order.id}/shipping`)}
            >
              Add Tracking
            </Button>
          )}

          {/* Confirm Return */}
          {(order.status === "RETURNED" || order.status === "BORROWING" || order.status === "OVERDUE") && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push(`/orders/${order.id}/confirm-return`)}
            >
              Confirm Return
            </Button>
          )}

          {/* Cancel Order */}
          {order.status === "PENDING_PAYMENT" && (
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => alert("TODO: Cancel order API")}
            >
              Cancel Order
            </Button>
          )}

          {/* Support：所有订单都能用 */}
          {order.status !== "COMPLETED" && (
          <Button
            variant="outline"
            className="border-black text-black hover:bg-black hover:text-white"
            onClick={() => router.push(`/complain?orderId=${order.id}`)}
          >
            Support
          </Button>
          )}

          {/* Write Review */}
          {order.status === "COMPLETED" && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push(`/orders/${order.id}/review`)}
            >
              Write Review
            </Button>
          )}
        </div>
      </Card>

      {/* Section 5 — More Details */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-2">More Details</h3>
        <div className="grid md:grid-cols-2 text-sm gap-y-1">
          <div>Order ID: <span className="font-mono">{order.id}</span></div>
          <div>Status: <span className="font-medium">{STATUS_META[order.status].label}</span></div>
          <div>Created: <span className="font-medium">{fmtDate(order.createdAt)}</span></div>
          {order.startAt && <div>Start: <span className="font-medium">{fmtDate(order.startAt)}</span></div>}
          {order.dueAt && <div>Due: <span className="font-medium">{fmtDate(order.dueAt)}</span></div>}
          {order.returnedAt && <div>Returned: <span className="font-medium">{fmtDate(order.returnedAt)}</span></div>}
          {order.completedAt && <div>Completed: <span className="font-medium">{fmtDate(order.completedAt)}</span></div>}
          {order.canceledAt && <div>Canceled: <span className="font-medium">{fmtDate(order.canceledAt)}</span></div>}
        </div>
      </Card>
    </div>
  );
}
