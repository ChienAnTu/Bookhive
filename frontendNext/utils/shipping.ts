 import axios from "axios";
import { getApiUrl } from "./auth";

const API_URL = getApiUrl();

export type ShippingQuote = {
  service: string;
  total_cost: number;
  delivery_time: string;
};

export type ShippingQuotesResponse = {
  AUS_PARCEL_REGULAR?: ShippingQuote;
  AUS_PARCEL_EXPRESS?: ShippingQuote;
};

/**
 * 调用后端 shipping API 获取报价
 * @param fromPostcode 发货人邮编（书主）
 * @param toPostcode 收货人邮编（当前用户）
 * @param length 包裹长 cm
 * @param width 包裹宽 cm
 * @param height 包裹高 cm
 * @param weight 包裹重量 kg
 */
export async function getShippingQuotes(
  fromPostcode: string,
  toPostcode: string,
  length: number,
  width: number,
  height: number,
  weight: number
): Promise<ShippingQuotesResponse> {
  try {
    const res = await axios.get(`${API_URL}/shipping/domestic/postage/calculate`, {
      params: {
        from_postcode: fromPostcode,
        to_postcode: toPostcode,
        length,
        width,
        height,
        weight,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error("Failed to fetch shipping quotes:", err);
    throw err;
  }
}


export type TrackingNumberItem = {
  order_id: string;
  shipping_out_tracking_number?: string | null;
  shipping_return_tracking_number?: string | null;
};

/**
 * @param userId option，Only administrators can upload
 */
export async function getUserAuspostTrackingNumbers(
  userId?: string
): Promise<TrackingNumberItem[]> {
  try {
    const res = await axios.get(`${API_URL}/api/v1/orders/tracking`, {
      params: userId ? { user_id: userId } : {},
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      withCredentials: true,
    });

    return res.data;
  } catch (err) {
    console.error("Failed to fetch tracking numbers:", err);
    throw err;
  }
}