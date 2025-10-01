// borrowing orders detail
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Truck, ArrowLeft, AlertTriangle } from "lucide-react";
import CoverImg from "@/app/components/ui/CoverImg";
import Card from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { toast } from "sonner";

import type { OrderStatus, ApiOrder } from "@/app/types/order";
import type { User } from "@/app/types/user";
import { getCurrentUser } from "@/utils/auth";

// Get API URL for this page specifically
const getOrderApiUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://your-production-api.com";
  }
  return process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
};

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Pending Payment", className: "text-amber-600" },
  PENDING_SHIPMENT: { label: "Pending Shipment", className: "text-blue-600" },
  BORROWING: { label: "Borrowing", className: "text-green-600" },
  OVERDUE: { label: "Overdue", className: "text-red-600" },
  RETURNED: { label: "Returned", className: "text-gray-700" },
  COMPLETED: { label: "Completed", className: "text-gray-500" },
  CANCELED: { label: "Canceled", className: "text-gray-400" },
};

// Helper function to format currency (assuming amounts are already in dollars)
const fmtAUD = (amount?: number) =>
  typeof amount === "number" ? `A$ ${amount.toFixed(2)}` : "—";

// Format date
const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

// API function to fetch order details using correct environment variable
const fetchOrderDetails = async (orderId: string): Promise<ApiOrder | null> => {
  try {
    const apiUrl = getOrderApiUrl();
    const fullUrl = `${apiUrl}/api/v1/orders/${orderId}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching order details:", error);
    return null;
  }
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load order data from API
  useEffect(() => {
    if (!id) return;

    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      const orderData = await fetchOrderDetails(id);
      if (orderData) {
        setOrder(orderData);
      } else {
        setError("Failed to load order details");
      }
      setLoading(false);
    };

    loadOrder();
  }, [id]);

  const statusMeta = useMemo(
    () => (order ? STATUS_META[order.status] : null),
    [order]
  );

  // Convert API books to the expected Book format
  const booksInOrder = useMemo(() => {
    if (!order) return [];
    return order.books.map((book) => ({
      id: book.bookId,
      title: book.titleEn,
      author: book.author,
      coverUrl: book.coverImgUrl || "/images/placeholder-book.png",
      // Add any other required Book properties with default values
      isbn: "",
      publisher: "",
      publishedYear: 0,
      description: "",
      category: "",
      condition: "good" as const,
      language: "en" as const,
      availableForBorrow: false,
      availableForSale: false,
      borrowPrice: { amount: 0 },
      salePrice: { amount: 0 },
      deposit: { amount: 0 },
      ownerId: order.owner.id,
      createdAt: "",
      updatedAt: "",
    }));
  }, [order]);

  const isOverdue =
    order &&
    (order.status === "BORROWING" || order.status === "OVERDUE") &&
    order.dueAt &&
    new Date(order.dueAt).getTime() < Date.now();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
    })();
  }, []);

  const isOwner = user?.id === order?.owner.id;
  const isBorrower = user?.id === order?.borrower.id;

  if (loading) {
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
        <Card>
          <div className="p-6">Loading order details...</div>
        </Card>
      </div>
    );
  }

  if (error || !order) {
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
        <Card>
          <div className="p-6">{error || "Order not found."}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Order ID + Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id}
          </h1>
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

          {/* Owner & Borrower */}
          <div className="text-sm text-gray-500 mt-3 flex flex-col gap-1">
            <div>
              Owner:{" "}
              <span className="text-black font-medium">{order.owner.name}</span>
            </div>
            <div>
              Borrower:{" "}
              <span className="text-black font-medium">
                {order.borrower.name}
              </span>
            </div>

            {/* Due date */}
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

        {/* Shipping Info */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-3">Shipping Info</h2>

          <div className="mt-3 text-gray-500 text-sm">
            <div>
              Delivery Method:{" "}
              <span className="font-medium text-black">
                {order.shippingMethod}
              </span>
            </div>

            {/* Contact Information */}
            <div className="mt-2 space-y-1">
              <div>
                Contact:{" "}
                <span className="font-medium text-black">
                  {order.contactName}
                </span>
              </div>
              <div>
                Phone:{" "}
                <span className="font-medium text-black">{order.phone}</span>
              </div>
              <div>
                Address:{" "}
                <span className="font-medium text-black">
                  {order.street}, {order.city}, {order.postcode},{" "}
                  {order.country}
                </span>
              </div>
            </div>

            {/* Tracking Information */}
            {(order.shippingOutTrackingNumber ||
              order.shippingReturnTrackingNumber) && (
              <div className="mt-2 flex items-center gap-6 flex-wrap">
                {order.shippingOutTrackingNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Outbound:&nbsp;
                    {order.shippingOutTrackingUrl ? (
                      <a
                        className="underline font-medium text-black"
                        href={order.shippingOutTrackingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {order.shippingOutTrackingNumber}
                      </a>
                    ) : (
                      order.shippingOutTrackingNumber
                    )}
                  </span>
                )}
                {order.shippingReturnTrackingNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Truck className="w-4 h-4" /> Return:&nbsp;
                    {order.shippingReturnTrackingUrl ? (
                      <a
                        className="underline"
                        href={order.shippingReturnTrackingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {order.shippingReturnTrackingNumber}
                      </a>
                    ) : (
                      order.shippingReturnTrackingNumber
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
              <div key={b.id} className="border rounded-lg p-3 w-48">
                <CoverImg
                  src={b.coverUrl}
                  title={b.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <h4 className="font-medium text-sm truncate">{b.title}</h4>
                <p className="text-xs text-gray-600 truncate">{b.author}</p>
              </div>
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
              <span>Deposit/Sale Amount</span>
              <span className="font-medium">
                {fmtAUD(order.depositOrSaleAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span className="font-medium">
                {fmtAUD(order.serviceFeeAmount)}
              </span>
            </div>
            {order.shippingOutFeeAmount > 0 && (
              <div className="flex justify-between">
                <span>Outbound Shipping</span>
                <span className="font-medium">
                  {fmtAUD(order.shippingOutFeeAmount)}
                </span>
              </div>
            )}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between text-sm">
            <span>Total Paid</span>
            <span className="font-semibold text-black">
              {fmtAUD(order.totalPaidAmount)}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-base font-semibold mb-3">Settlement</h3>
          <div className="space-y-2 text-sm">
            {order.lateFeeAmount > 0 && (
              <div className="flex justify-between">
                <span>Late Fee</span>
                <span className="font-medium">
                  {fmtAUD(order.lateFeeAmount)}
                </span>
              </div>
            )}
            {order.damageFeeAmount > 0 && (
              <div className="flex justify-between">
                <span>Damage Fee</span>
                <span className="font-medium">
                  {fmtAUD(order.damageFeeAmount)}
                </span>
              </div>
            )}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between text-sm">
            <span>Total Refunded</span>
            <span className="font-semibold text-black">
              {fmtAUD(order.totalRefundedAmount)}
            </span>
          </div>
        </Card>
      </div>

      {/* Section 4 — Action */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-3">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {/* Borrower action */}
          {/* Pay Now */}
          {isBorrower && order.status === "PENDING_PAYMENT" && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => alert("TODO: Pay flow")}
            >
              Pay Now
            </Button>
          )}

          {/* Return */}
          {isBorrower &&
            (order.status === "BORROWING" || order.status === "OVERDUE") && (
              <Button
                className="bg-black text-white hover:bg-gray-800"
                onClick={() =>
                  router.push(`/borrow/${order.id}/confirm-return`)
                }
              >
                Return
              </Button>
            )}

          {/* Cancel Order */}
          {(isBorrower || isOwner) && order.status === "PENDING_PAYMENT" && (
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={async () => {
                if (!user) {
                  toast.error("Please login first");
                  router.push("/auth");
                  return;
                }

                const confirmCancel = window.confirm(
                  "Are you sure you want to cancel this order? This action cannot be undone."
                );
                if (!confirmCancel) return;

                try {
                  const token = localStorage.getItem("access_token"); // 使用 access_token
                  if (!token) {
                    toast.error(
                      "Authentication required. Please log in again."
                    );
                    router.push("/auth");
                    return;
                  }

                  const res = await fetch(
                    `${getOrderApiUrl()}/api/v1/orders/${order.id}/cancel`,
                    {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`, // 添加JWT token
                      },
                    }
                  );

                  if (!res.ok) throw new Error("Failed to cancel order");

                  toast.success("Order cancelled successfully");

                  // Reload the order data to show updated status
                  const updatedOrder = await fetchOrderDetails(id);
                  if (updatedOrder) {
                    setOrder(updatedOrder);
                  }
                } catch (err) {
                  console.error("Cancel order error:", err);
                  toast.error("Failed to cancel order");
                }
              }}
            >
              Cancel Order
            </Button>
          )}

          {/* Owner Action */}
          {/* Add Tracking */}
          {isOwner && order.status === "PENDING_SHIPMENT" && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => router.push(`/orders/${order.id}/shipping`)}
            >
              Ship
            </Button>
          )}

          {/* Common Actions */}
          {/* Message */}
          {order.status !== "COMPLETED" && order.status !== "CANCELED" && (
            <Button
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={() => {
                if (!user) {
                  toast.error("Please login first");
                  router.push("/auth");
                  return;
                }
                router.push(`/messages?orderId=${order.id}`);
              }}
            >
              Message
            </Button>
          )}

          {/* Support */}
          {order.status !== "COMPLETED" &&
            order.status !== "PENDING_PAYMENT" && (
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
                onClick={() => {
                  if (!user) {
                    toast.error("Please login first");
                    router.push("/auth");
                    return;
                  }
                  router.push(`/complain?orderId=${order.id}`);
                }}
              >
                Support
              </Button>
            )}

          {/* Write Review */}
          {order.status === "COMPLETED" && (
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => {
                if (!user) {
                  toast.error("Please login first");
                  router.push("/auth");
                  return;
                }
                router.push(`/borrowing/${order.id}/review`);
              }}
            >
              Write Review
            </Button>
          )}

          {/* Login Button for unauthenticated users */}
          {!user && (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => router.push("/auth")}
            >
              Login to View Actions
            </Button>
          )}
        </div>
      </Card>

      {/* Section 5 — More Details */}
      <Card className="p-4">
        <h3 className="text-base font-semibold mb-2">More Details</h3>
        <div className="grid md:grid-cols-2 text-sm gap-y-1">
          <div>
            Order ID: <span className="font-medium">{order.id}</span>
          </div>
          <div>
            Status:{" "}
            <span className="font-medium">
              {STATUS_META[order.status].label}
            </span>
          </div>
          <div>
            Action Type: <span className="font-medium">{order.actionType}</span>
          </div>
          <div>
            Created:{" "}
            <span className="font-medium">{fmtDate(order.createdAt)}</span>
          </div>
          <div>
            Updated:{" "}
            <span className="font-medium">{fmtDate(order.updatedAt)}</span>
          </div>
          {order.startAt && (
            <div>
              Start Borrowing:{" "}
              <span className="font-medium">{fmtDate(order.startAt)}</span>
            </div>
          )}
          {order.dueAt && (
            <div>
              Due: <span className="font-medium">{fmtDate(order.dueAt)}</span>
            </div>
          )}
          {order.returnedAt && (
            <div>
              Returned:{" "}
              <span className="font-medium">{fmtDate(order.returnedAt)}</span>
            </div>
          )}
          {order.completedAt && (
            <div>
              Completed:{" "}
              <span className="font-medium">{fmtDate(order.completedAt)}</span>
            </div>
          )}
          {order.canceledAt && (
            <div>
              Canceled:{" "}
              <span className="font-medium">{fmtDate(order.canceledAt)}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
