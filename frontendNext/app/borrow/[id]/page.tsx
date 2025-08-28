
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getBookById, getUserById } from "@/app/data/mockData";
//import Breadcrumb from "@/app/components/ui/Breadcrumb";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

export default function BorrowPage() {
  const { id } = useParams();
  const router = useRouter();
  const book = getBookById(id as string);

  if (!book) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Book not found</h2>
        <Button variant="primary" onClick={() => router.push("/books")}>
          Back to Books
        </Button>
      </div>
    );
  }

  const owner = getUserById(book.ownerId);

  const [form, setForm] = useState({
    shippingWay: "delivery",
    deliveryAddress: "",
  });

  // calculate fees
  const fees = {
    deposit: book.fees.deposit,
    serviceFee: book.fees.serviceFee,
    shipping: form.shippingWay === "delivery" ? book.fees.estimatedShipping : 0,
  };
  const total = fees.deposit + fees.serviceFee + fees.shipping;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Borrow confirmed:", {
      bookId: id,
      bookTitle: book.titleOr,
      ...form,
      total,
    });
    // TODO: Call the API → Create an order
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto p-6">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{book.titleOr}</h1>
        <p className="text-gray-600 mb-6">Borrow it from {owner?.name || "Platform User"}</p>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-6 space-y-6"
        >
          {/* Shipping Way */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Way
            </label>
            <select
              name="shippingWay"
              value={form.shippingWay}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black"
            >
              <option value="pickup">Pickup in person</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>

          {/* Delivery Address */}
          {form.shippingWay === "delivery" && (
            <Input
              label="Delivery Address"
              name="deliveryAddress"
              value={form.deliveryAddress}
              onChange={handleChange}
              placeholder="Enter delivery address"
              required
            />
          )}

          {/* Fees & Costs */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-gray-900 font-medium mb-4">Fees & Costs</h3>
            <div className="flex justify-between mb-2">
              <span>Deposit (refundable)</span>
              <span>${fees.deposit}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Platform Service Fee</span>
              <span>${fees.serviceFee}</span>
            </div>
            {form.shippingWay === "delivery" && (
              <div className="flex justify-between mb-2">
                <span>Estimated Shipping</span>
                <span>${fees.shipping}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Expected Cost</span>
              <span>${total}</span>
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Deposits are refundable upon book return in good condition. 
              Service fees and shipping costs are non-refundable.
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" fullWidth>
              Confirm And Pay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
