"use client";

import { useState } from "react";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import { mockBooks } from "@/app/data/mockData";
import { Book } from "@/app/types/book";

export default function LendBookPage() {
  const [form, setForm] = useState({
    titleOrigin: "",
    language: "",
    titleEn: "",
    author: "",
    category: "",
    description: "",
    coverImage: null as File | null,
    tags: "",
    depositPrice: "",
    lendDuration: "",
    condition: "like-new",
    conditionImages: [] as File[],
    isbn: "",
    publishYear: "",
    shippingPickup: false,
    shippingDelivery: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, coverImage: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // check Shipping Way
    if (!form.shippingPickup && !form.shippingDelivery) {
      setShowErrors(true);
      return;
    }

    // create a Book
    const newBook: Book = {
      id: `book-${Date.now()}`,
      titleOr: form.titleOrigin,
      titleEn: form.titleEn || "",
      originalLanguage: form.language,
      author: form.author,
      category: form.category,
      description: form.description,
      coverImgUrl: form.coverImage
        ? URL.createObjectURL(form.coverImage)
        : "https://via.placeholder.com/300x400?text=No+Cover",
      ownerId: "user1", // TODO: Replace with current logged-in user

      status: "listed",
      condition: form.condition as Book["condition"],
      conditionImgURLs: form.conditionImages.map((file) =>
        URL.createObjectURL(file)
      ),

      dateAdded: new Date().toISOString(),
      updateDate: new Date().toISOString(),

      isbn: form.isbn || undefined,
      publishYear: form.publishYear ? Number(form.publishYear) : undefined,
      tags: form.tags.split(",").map((k) => k.trim()).filter(Boolean),
      maxLendingDays: Number(form.lendDuration) || 14,

      deliveryMethod:
        form.shippingPickup && form.shippingDelivery
          ? "both"
          : form.shippingPickup
            ? "self-help"
            : "post",

      fees: {
        deposit: Number(form.depositPrice),
        serviceFee: 3,
        estimatedShipping: form.shippingDelivery ? 8 : undefined,
      },
    };


    // save
    mockBooks.push(newBook);

    console.log("New book added:", newBook);
    alert("Book has been listed successfully!");
  };

  const [showErrors, setShowErrors] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Start Lending</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        {/* Title + Language */}
        <div className="flex gap-2 items-start">
          <Input
            label="Title - Origin*"
            name="titleOrigin"
            value={form.titleOrigin}
            onChange={handleChange}
            required
          />
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              name="Language*"
              value={form.language}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select</option>
              <option value="English">English</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>

        {/* Title En */}
        <Input
          label="Title - En*"
          name="titleEn"
          value={form.titleEn}
          onChange={handleChange}
          required
        />

        {/* Author */}
        <Input
          label="Author*"
          name="author"
          value={form.author}
          onChange={handleChange}
          required
        />

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category*
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="">Please choose a category</option>
            <option value="Fiction">Fiction</option>
            <option value="Sci-Fi">Sci-Fi</option>
            <option value="Non-Fiction">Non-Fiction</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description*
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black"
            required
          />
        </div>

        {/* Tags */}
        <Input
          label="Tags (separate by ,)"
          name="Tags"
          value={form.tags}
          onChange={handleChange}
        />

        {/* ISBN */}
        <Input
          label="ISBN"
          name="isbn"
          value={form.isbn}
          onChange={handleChange}
          placeholder="Optional-International Standard Book Number"
        />

        {/* Publish Year */}
        <Input
          label="Publish Year"
          name="publishYear"
          value={form.publishYear}
          onChange={handleChange}
          placeholder="e.g. 2020"
        />

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image
          </label>

          <div className="flex items-center gap-4">
            {/* Hidden input */}
            <input
              type="file"
              id="cover-upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* upload button */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("cover-upload")?.click()}
            >
              Upload Image
            </Button>

            {/* preview */}
            {form.coverImage && (
              <img
                src={URL.createObjectURL(form.coverImage)}
                alt="Preview"
                className="h-20 w-16 object-cover rounded border"
              />
            )}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition*
          </label>
          <select
            name="condition"
            value={form.condition}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          >
            <option value="new">New</option>
            <option value="like-new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>

        {/* Condition Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition Photos
          </label>

          {/* Hidden input */}
          <input
            type="file"
            id="condition-upload"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setForm((prev) => ({
                ...prev,
                conditionImages: [...prev.conditionImages, ...files],
              }));
            }}
            className="hidden"
          />

          {/* upload button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => document.getElementById("condition-upload")?.click()}
          >
            Upload Images
          </Button>

          {/* preview */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.conditionImages.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`Condition ${index + 1}`}
                className="h-20 w-16 object-cover rounded border"
              />
            ))}
          </div>
        </div>


        {/* Deposit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Fee*
          </label>
          <div className="flex items-center gap-2">
            <Input
              name="depositPrice"
              value={form.depositPrice}
              onChange={handleChange}
              placeholder="AU$"
              required
            />
          </div>
        </div>

        {/* Lend Duration */}
        <div className="flex items-center gap-2">
          <Input
            label="Lend Duration*"
            name="lendDuration"
            value={form.lendDuration}
            onChange={handleChange}
            placeholder="Days"
            required
          />
        </div>

        {/* Shipping Way */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Way* (at least one)
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="shippingPickup"
                checked={form.shippingPickup}
                onChange={handleChange}
              />
              Self Pickup
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="shippingDelivery"
                checked={form.shippingDelivery}
                onChange={handleChange}
              />
              Delivery
            </label>
          </div>
          {showErrors && !(form.shippingPickup || form.shippingDelivery) && (
            <p className="text-sm text-red-600 mt-1">
              Please select at least one option
            </p>
          )}

        </div>


        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" fullWidth>
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
