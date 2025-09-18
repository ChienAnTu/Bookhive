// utils/serviceFee.ts
import axios from "axios";
import { getApiUrl } from "./auth";

const API_URL = getApiUrl();

export async function listServiceFees() {
  const res = await axios.get(`${API_URL}/api/v1/service-fees/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data;
}

export async function getServiceFee(feeId: string) {
  const res = await axios.get(`${API_URL}/api/v1/service-fees/${feeId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data;
}

export async function createServiceFee(payload: {
  name: string;
  description?: string;
  feeType: "PERCENT" | "FIXED";
  value: number;
  status: boolean;
}) {
  const res = await axios.post(`${API_URL}/api/v1/service-fees/`, payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data;
}

export async function updateServiceFee(feeId: string, payload: Partial<{
  name: string;
  description?: string;
  feeType: "PERCENT" | "FIXED";
  value: number;
  status: boolean;
}>) {
  const res = await axios.put(`${API_URL}/api/v1/service-fees/${feeId}`, payload, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data;
}

export async function deleteServiceFee(feeId: string) {
  const res = await axios.delete(`${API_URL}/api/v1/service-fees/${feeId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
    withCredentials: true,
  });
  return res.data;
}
