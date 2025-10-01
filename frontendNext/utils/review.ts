import axios from "axios";
import { getApiUrl } from "./auth";
import { Comment, RatingStats } from "@/app/types";

const API_URL = getApiUrl();

// ---------- Reviews API ----------

// Create review
export async function createReview(data: {
  orderId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}) {
  const res = await axios.post(
    `${API_URL}/api/v1/reviews/`,
    null, // 👈 body 为空
    {
      params: {
        order_id: data.orderId,
        reviewee_id: data.revieweeId,
        rating: data.rating,
        comment: data.comment,
      },
      withCredentials: true,
    }
  );
  return res.data;
}


// Received Reviews
export async function getReviewsByUser(userId: string): Promise<Comment[]> {
  const res = await axios.get(`${API_URL}/api/v1/reviews/user/${userId}`);
  return res.data;
}

// Sent Reviews
export async function getReviewsByReviewer(userId: string): Promise<Comment[]> {
  const res = await axios.get(`${API_URL}/api/v1/reviews/reviewer/${userId}`);
  return res.data;
}

// Reviews under orders
export async function getReviewsByOrder(orderId: string): Promise<Comment[]> {
  const res = await axios.get(`${API_URL}/api/v1/reviews/order/${orderId}`);
  return res.data;
}

// Get user rating
export async function getUserRatingSummary(userId: string): Promise<RatingStats> {
  const res = await axios.get(`${API_URL}/api/v1/reviews/user/${userId}/rating`);
  const data = res.data;

  return {
    averageRating: data.average,
    totalReviews: data.total_reviews,
    ratingDistribution: data.distribution,
  };
}
