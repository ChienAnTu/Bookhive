"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import StarRating from "@/app/components/ui/StarRating";
import Button from "@/app/components/ui/Button";
import { createReview } from "@/utils/review";
import { getOrderById } from "@/utils/borrowingOrders";
import { getCurrentUser } from "@/utils/auth";

const OrderReviewPage = () => {
const { id } = useParams<{ id: string }>();
const orderId = id;
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [revieweeId, setRevieweeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadOrderAndUser = async () => {
    try {
      const [order, currentUser] = await Promise.all([
        getOrderById(orderId),
        getCurrentUser(),
      ]);

      console.log("order:", order);
      console.log("currentUser:", currentUser);

      if (!order || !currentUser) {
        throw new Error("Order or user not found");
      }

      if (currentUser.id === order.borrower.id) {
        setRevieweeId(order.owner.id);
      } else if (currentUser.id === order.owner.id) {
        setRevieweeId(order.borrower.id);
      } else {
        console.warn("Current user is not this order related personnel");
        setRevieweeId(null);
      }
    } catch (err) {
      console.error("Failed to load order/user:", err);
    } finally {
      setLoading(false);
    }
  };

  loadOrderAndUser();
}, [orderId]);


  const handleSubmit = async () => {
    if (!revieweeId) {
      alert("Cannot determine reviewee.");
      return;
    }

    try {
      await createReview({
        orderId,
        revieweeId,
        rating,
        comment,
      });
      alert("Review submitted!");
      router.push(`/borrowing/${orderId}`);
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      alert(err.response?.data?.detail || "Failed to submit review");
    }
  };

  if (loading) {
    return <div className="p-6">Loading order...</div>;
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4">Write Review</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Rating</label>
        <StarRating rating={rating} onRatingChange={setRating} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full border rounded p-2"
          placeholder="Write your review..."
        />
      </div>

      <Button variant="primary" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
};

export default OrderReviewPage;
