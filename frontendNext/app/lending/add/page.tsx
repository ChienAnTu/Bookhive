// Create a new book to lend
"use client";

import { useState } from "react";
import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import Select from "@/app/components/ui/Select";
import { Book } from "@/app/types/book";
import { createBook, uploadFile } from "@/utils/books";
import { getCurrentUser } from "@/utils/auth";
import { useRouter } from "next/navigation";

type UploadedFile = {
  file?: File;
  url: string;

};

type FormState = Omit<Book, "id" | "ownerId" | "dateAdded" | "updateDate"> & {
  coverFile: UploadedFile | null;
  conditionFiles: UploadedFile[];
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

  const [customLang, setCustomLang] = useState("");
  const [languages, setLanguages] = useState([
    "English",
    "Chinese",
    "Hindi",
    "Japanese",
  ]);

  const [tagsInput, setTagsInput] = useState("");

  const [showErrors, setShowErrors] = useState(false);
  const router = useRouter();

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type, checked } = e.target as HTMLInputElement;

  // 1) 先单独处理 originalLanguage 的“添加新语言”分支（不要放在 setForm 回调里）
  if (name === "originalLanguage" && value === "__add_new__") {
    const newLang = window.prompt("Enter new language:")?.trim();
    if (newLang) {
      if (!languages.includes(newLang)) {
        setLanguages((langs) => [...langs, newLang]);
      }
      // 这里安全更新表单：始终返回完整对象
      setForm((prev) => {
        const updated: FormState = { ...prev, originalLanguage: newLang };
        // 如果之前没填英文标题，且新语言为 English，则自动同步
        if (newLang === "English" && !prev.titleEn) {
          updated.titleEn = prev.titleOr;
        }
        return updated;
      });
    } else {
      // 用户取消输入：把选择恢复到原值（什么都不做即可）
    }
    return; // 结束
  }

  // 2) 其它常规分支放在一个 setForm 回调里，保证“每个路径都 return”
  setForm((prev) => {
    let updated: FormState = { ...prev };

    // originalLanguage（非 add 分支）
    if (name === "originalLanguage") {
      updated.originalLanguage = value;
      if (value === "English" && !prev.titleEn) {
        updated.titleEn = prev.titleOr;
      }
      return updated;
    }

    // titleOr：如果原语言是 English 且没填 titleEn，自动同步
    if (name === "titleOr") {
      updated.titleOr = value;
      if (prev.originalLanguage === "English" && !prev.titleEn) {
        updated.titleEn = value;
      }
      return updated;
    }

    // 数字字段
    if (["deposit", "salePrice", "publishYear", "maxLendingDays"].includes(name)) {
      (updated as any)[name] = value ? Number(value) : undefined;
      return updated;
    }

    // 其它通用字段（checkbox / text）
    (updated as any)[name] = type === "checkbox" ? checked : value;
    return updated;
  });
};


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
        coverFile: { file, url },   // file + url
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
            return null;
          }
          const url = await uploadFile(file, "book");
          return { file, url };
        })
      );

      const valid = uploaded.filter((f): f is { file: File; url: string } => f !== null);

      setForm((prev) => ({
        ...prev,
        conditionFiles: [...prev.conditionFiles, ...valid],
      }));
    } catch (err) {
      console.error("Condition image upload failed:", err);
    }
  };

  // remove condition files
  const handleRemoveConditionFile = (index: number) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        conditionFiles: prev.conditionFiles.filter((_, i) => i !== index),
      };
    });
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
            <Select
              label="Original Language"
              name="originalLanguage"
              value={form.originalLanguage}
              onChange={handleChange}
              required
            >
              <option value="">Select the book's original language</option>
              {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
        <option value="__add_new__" className="text-blue-500">
          ➕ Add new language...
        </option>
      </Select>

            <Input
              label="Title (Original Language)*"
              name="titleOr"
              value={form.titleOr}
              onChange={handleChange}
              required
              placeholder={
                form.originalLanguage === "Chinese"
                  ? "例如：《红楼梦》"
                  : form.originalLanguage === "Hindi"
                    ? "उदाहरण: गीता"
                    : form.originalLanguage === "Japanese"
                      ? "例：吾輩は猫である"
                      : "e.g., Harry Potter and the Philosopher's Stone"
              }
            />

            {/* Title En */}
            <Input
              label="Title (English)*"
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
            <Select
              label="Category*"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Please choose a category</option>
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Biography">Biography & Memoir</option>
              <option value="History">History</option>
              <option value="Science">Science & Technology</option>
              <option value="Self-Help">Self-Help & Personal Development</option>
              <option value="Education">Education & Textbook</option>
              <option value="Children">Children & Young Adult</option>
              <option value="Comics">Comics & Graphic Novels</option>
            </Select>

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
              placeholder="International Standard Book Number"
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
            <Select
              label="Condition*"
              name="condition"
              value={form.condition}
              onChange={handleChange}
              required
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </Select>

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
                  <div key={i} className="relative">
                    <img
                      src={f.url || (f.file ? URL.createObjectURL(f.file) : "")}
                      alt={`Condition ${i + 1}`}
                      className="h-20 w-16 object-cover rounded border"
                    />
                    {/* delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveConditionFile(i)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full px-1"
                    >
                      ✕
                    </button>
                  </div>
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

                {/* Rent */}
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

                  {/* canRent = true */}
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
                        name="maxLendingDays"
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
