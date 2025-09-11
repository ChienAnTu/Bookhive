// Create a new book to lend
"use client";

import { useState } from "react";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import { Book } from "@/app/types/book";
import { createBook, uploadFile } from "@/utils/books";
import { getCurrentUser } from "@/utils/auth";
import { useRouter } from "next/navigation";

type UploadedFile = {
  file?: File;   // 本地文件（用于预览）
  url: string;   // 后端返回的 URL

};

type FormState = Omit<Book, "id" | "ownerId" | "dateAdded" | "updateDate"> & {
  coverFile: UploadedFile | null;     // 封面 → 单个文件
  conditionFiles: UploadedFile[];     // 条件图 → 多个文件
};

export default function AddBook() {
  const [form, setForm] = useState<FormState>({
    titleOr: "",
    titleEn: "",
    originalLanguage: "",
    author: "",
    category: "",
    description: "",
    coverImgUrl: "",
    tags: [],
    deposit: undefined,
    salePrice: undefined,
    maxLendingDays: 14,
    condition: "like-new",
    conditionImgURLs: [],
    isbn: "",
    publishYear: undefined,
    deliveryMethod: "both",
    canRent: true,
    canSell: false,
    status: "listed",

    coverFile: null,
    conditionFiles: [],
  });

  const [tagsInput, setTagsInput] = useState("");

  const [showErrors, setShowErrors] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setForm((prev) => {
      if (name === "tags") {
        return {
          ...prev,
          tags: value.split(",").map((t) => t.trim()).filter(Boolean),
        };
      }

      if (["deposit", "salePrice", "publishYear", "maxLendingDays"].includes(name)) {
        return {
          ...prev,
          [name]: value ? Number(value) : undefined,
        };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };


  // upload image
  // cover image
  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("The size of the picture cannot exceed 2MB");
      return;
    }

    try {
      const url = await uploadFile(file, "book");
      setForm((prev) => ({
        ...prev,
        coverFile: { file, url },   // 包含 file + url
        coverImgUrl: url,
      }));
    } catch (err) {
      console.error("Cover image upload failed:", err);
    }
  };

  // condition files
  const handleConditionFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        if (file.size > 2 * 1024 * 1024) {
          alert("The size of the picture cannot exceed 2MB");
          return null; // 返回 null
        }
        const url = await uploadFile(file, "book");
        return { file, url }; // 返回对象
      })
    );

    // 过滤掉 null
    const valid = uploaded.filter((f): f is { file: File; url: string } => f !== null);

    setForm((prev) => ({
      ...prev,
      conditionFiles: [...prev.conditionFiles, ...valid],
    }));
  } catch (err) {
    console.error("Condition image upload failed:", err);
  }
};



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.deliveryMethod) {
      setShowErrors(true);
      return;
    }

    const user = await getCurrentUser();
    if (!user?.id) {
      alert("Please login first.");
      return;
    }
    // 1. create a Book
    const newBook: Book = {
      id: `book-${Date.now()}`,
      titleOr: form.titleOr,
      titleEn: form.titleEn || "",
      originalLanguage: form.originalLanguage,
      author: form.author,
      category: form.category,
      description: form.description,
      coverImgUrl: form.coverFile?.url || "https://via.placeholder.com/300x400?text=No+Cover",

      ownerId: user.id,

      status: "listed",
      condition: form.condition as Book["condition"],
      conditionImgURLs: form.conditionFiles.map((f) => f.url),

      dateAdded: new Date().toISOString(),
      updateDate: new Date().toISOString(),

      isbn: form.isbn || undefined,
      publishYear: form.publishYear ? Number(form.publishYear) : undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      maxLendingDays: Number(form.maxLendingDays) || 14,

      deliveryMethod: form.deliveryMethod as Book["deliveryMethod"],
      canRent: form.canRent,
      canSell: form.canSell,

      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      deposit: form.deposit ? Number(form.deposit) : undefined,
    };

    try {
      // 2. Call the backend interface
      const created = await createBook(newBook);

      // 3. feedback
      console.log("Book created:", created);
      alert("Book has been listed successfully!");


      router.push(`/books/${created.id}`);
    } catch (error) {
      console.error("Failed to create book:", error);
      alert("Failed to list book.");
    }

  };


  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Lending</h1>
        <p className="text-gray-600"> List your books for rent or sale and make them available to the community.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6"
      >
        <div className="lg:flex lg:divide-x lg:divide-gray-200">

          {/* left*/}
          <div className="lg:w-1/2 lg:pr-8 space-y-6">

            {/* Title + Language */}
            <div className="flex gap-2 items-start">
              <Input
                label="Title - Origin*"
                name="titleOr"
                value={form.titleOr}
                onChange={handleChange}
                required
              />
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  name="originalLanguage"
                  value={form.originalLanguage}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
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

            <Input
              label="Tags (separate by ,)"
              name="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}

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
                Cover Image (max. 2MB)
              </label>

              <div className="flex items-center gap-4">
                {/* hidded input */}
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleCoverFile}
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

                {/* preview cover*/}
                {form.coverFile && (
                  <img
                    src={
                      form.coverFile.url
                        ? form.coverFile.url
                        : form.coverFile.file
                          ? URL.createObjectURL(form.coverFile.file)
                          : ""
                    }
                    alt="Preview"
                    className="h-20 w-16 object-cover rounded border"
                  />
                )}

              </div>
            </div>
          </div>

          {/* right */}
          <div className="lg:w-1/2 lg:pl-8 space-y-6">

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
                Condition Photos (max. 2MB)
              </label>

              {/* hidded input */}
              <input
                type="file"
                id="condition-upload"
                accept="image/*"
                multiple
                onChange={handleConditionFiles}
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

              {/* preview condition imgs*/}
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.conditionFiles.map((f, i) => (
                  <img
                    src={f.url || (f.file ? URL.createObjectURL(f.file) : "")}
                    alt={`Condition ${i + 1}`}
                    className="h-20 w-16 object-cover rounded border"
                  />
                ))}
              </div>

            </div>

            <hr className="my-6 border-gray-300" />

            {/* Trading Way */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trading Way* (at least one)
              </label>

              <div className="space-y-4">
                {/* Sell 区块 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="canSell"
                      checked={form.canSell}
                      onChange={handleChange}
                    />
                    Sell
                  </label>

                  {/* 仅当 canSell = true 时显示 & 必填 */}
                  {form.canSell && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Sale Price*"
                        name="salePrice"
                        value={form.salePrice}
                        onChange={handleChange}
                        placeholder="AU$"
                        required={form.canSell}
                      />
                    </div>
                  )}
                </div>

                {/* Rent 区块 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="canRent"
                      checked={form.canRent}
                      onChange={handleChange}
                    />
                    Lend Out
                  </label>

                  {/* 仅当 canRent = true 时显示 & 必填 */}
                  {form.canRent && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Deposit Fee*"
                        name="deposit"
                        value={form.deposit}
                        onChange={handleChange}
                        placeholder="AU$"
                        required={form.canRent}
                      />
                      <Input
                        label="Lend Duration*"
                        name="lendDuration"
                        value={form.maxLendingDays}
                        onChange={handleChange}
                        placeholder="Days"
                        required={form.canRent}
                      />
                    </div>
                  )}
                </div>
              </div>

              {showErrors && !(form.canRent || form.canSell) && (
                <p className="text-sm text-red-600 mt-1">
                  Please select at least one option
                </p>
              )}
            </div>


            {/* Delivery Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method*
              </label>

              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="post"
                    checked={form.deliveryMethod === "post"}
                    onChange={handleChange}
                  />
                  Post
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={form.deliveryMethod === "pickup"}
                    onChange={handleChange}
                  />
                  Pickup
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="both"
                    checked={form.deliveryMethod === "both"}
                    onChange={handleChange}
                  />
                  Both
                </label>
              </div>

              {showErrors && !form.deliveryMethod && (
                <p className="text-sm text-red-600 mt-1">Please choose a delivery method</p>
              )}
            </div>

          </div>
        </div>

        {/* 提交区：占满两列 */}
        <div className="lg:col-span-2">
          <hr className="my-4 border-gray-200" />
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
              Submit
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
