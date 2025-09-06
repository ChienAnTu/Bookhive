// Edit a lending book
"use client";

import { useState, useEffect } from "react";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import { Book } from "@/app/types/book";
import { getBookById, updateBook } from "@/utils/books";
import { getCurrentUser } from "@/utils/auth";
import { useRouter, useParams } from "next/navigation";


type FormState = Omit<Book, "id" | "ownerId" | "dateAdded" | "updateDate"> & {
  coverFile: File | null;
  conditionFiles: File[];
};

export default function EditBookPage() {
  const { id: bookId } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  // Fill form by current book
  useEffect(() => {
    (async () => {
      setLoading(true);
      const b = await getBookById(bookId);
      if (!b) {
        setLoading(false);
        return;
      }
      setForm({
        titleOr: b.titleOr,
        titleEn: b.titleEn,
        originalLanguage: b.originalLanguage,
        author: b.author,
        category: b.category,
        description: b.description,
        coverImgUrl: b.coverImgUrl ?? "",
        conditionImgURLs: b.conditionImgURLs ?? [],
        status: b.status,
        condition: b.condition,
        canRent: b.canRent,
        canSell: b.canSell,
        isbn: b.isbn ?? "",
        tags: b.tags ?? [],
        publishYear: b.publishYear,
        maxLendingDays: b.maxLendingDays,
        deliveryMethod: b.deliveryMethod,
        salePrice: b.salePrice,
        deposit: b.deposit,

        // 本地上传控件
        coverFile: null,
        conditionFiles: [],
      });
      setTagsInput((b.tags ?? []).join(", "));
      setLoading(false);
    })();
  }, [bookId]);

  if (loading || !form) {
    return <div className="p-6">Loading…</div>;
  }

  // 通用输入
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setForm((prev) => {
      if (!prev) return prev;
      if (["deposit", "salePrice", "publishYear", "maxLendingDays"].includes(name)) {
        return { ...prev, [name]: value ? Number(value) : undefined };
      }
      return { ...prev, [name]: type === "checkbox" ? checked : value };
    });
  };

  // 封面/成色图文件
  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => (prev ? { ...prev, coverFile: file } : prev));
  };
  const handleConditionFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => (prev ? { ...prev, conditionFiles: files } : prev));
  };

  // 提交：update 而不是 create
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

    // 如果需要真实上传图片，放开下面注释，先 upload 再把 URL 写回 payload
    let coverImgUrl = form.coverImgUrl;
    // if (form.coverFile) {
    //   coverImgUrl = await uploadFile(form.coverFile, "books/covers");
    // }
    let conditionImgURLs = form.conditionImgURLs ?? [];
    // if (form.conditionFiles.length) {
    //   const urls = await Promise.all(form.conditionFiles.map(f => uploadFile(f, "books/conditions")));
    //   conditionImgURLs = urls;
    // }

    const payload: Partial<Book> = {
      titleOr: form.titleOr,
      titleEn: form.titleEn,
      originalLanguage: form.originalLanguage,
      author: form.author,
      category: form.category,
      description: form.description,
      coverImgUrl,
      conditionImgURLs,
      status: form.status,
      condition: form.condition,
      canRent: form.canRent,
      canSell: form.canSell,
      isbn: form.isbn || undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      publishYear: form.publishYear,
      maxLendingDays: form.maxLendingDays,
      deliveryMethod: form.deliveryMethod,
      salePrice: form.salePrice,
      deposit: form.deposit,
    };

    await updateBook(bookId, payload);
    alert("Saved!");
    router.push("/lending");
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

          {/* left：基本信息 / 元信息 / 图片 */}
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
                Cover Image
              </label>

              <div className="flex items-center gap-4">
                {/* 隐藏的 input */}
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

                {/* preview */}
                {form.coverFile && (
                  <img
                    src={URL.createObjectURL(form.coverFile)}
                    alt="Preview"
                    className="h-20 w-16 object-cover rounded border"
                  />
                )}
              </div>
            </div>
          </div>

          {/* right：成色 / 交易设置 / 配送 */}
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
                Condition Photos
              </label>

              {/* 隐藏的 input */}
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

              {/* preview */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.conditionFiles.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Condition ${index + 1}`}
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
