// lending list
"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, BookOpen, MoreHorizontal } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { Book } from "@/app/types/book";
import { getCurrentUser } from "@/utils/auth";
import { getBooks, updateBook, deleteBook } from "@/utils/books";
import { useRouter } from "next/navigation";


export default function LendingListPage() {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | Book["status"]>("all");

  // recode which book openes ...（null means no one）
  const [openId, setOpenId] = useState<string | null>(null);

  // get current user's books
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const user = await getCurrentUser();
        if (!user) {
          setItems([]);
          return;
        }

        const list = await getBooks({ ownerId: user.id, page: 1, pageSize: 100 });
        if (alive) setItems(list);
      } catch (e: any) {
        if (alive) setErr(e?.message || "loading fail");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // close pull-down menu by click space
  useEffect(() => {
    const onDocClick = () => setOpenId(null);
    if (openId) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [openId]);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenId((prev) => (prev === id ? null : id));
  };

  const onEdit = (id: string) => {
    console.log("edit", id);
    setOpenId(null);
  };
  const onHistory = (id: string) => {
    console.log("history", id);
    setOpenId(null);
  };
  const onDelete = (id: string) => {
    console.log("delete", id);
    setOpenId(null);
  };

  // search + filter
  const filteredBooks = useMemo(() => {
    let filtered = items;
    if (selectedFilter !== "all") {
      filtered = filtered.filter((b) => b.status === selectedFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.titleOr.toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, search, selectedFilter]);

  const countBy = (s: Book["status"]) => items.filter((b) => b.status === s).length;
  const filterOptions = [
    { value: "all", label: "All", count: items.length },
    { value: "listed", label: "Listed", count: countBy("listed") },
    { value: "unlisted", label: "Unlisted", count: countBy("unlisted") },
    { value: "lent", label: "Lend Out", count: countBy("lent") },
    { value: "sold", label: "Sold", count: countBy("sold") },
  ] as const;

  const router = useRouter();

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Lending List</h1>
              <p className="text-gray-600">Manage your listed, unlisted, and lent out books</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by book title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedFilter === option.value ? "default" : "outline"}
                  onClick={() => setSelectedFilter(option.value as any)}
                  className={`flex items-center gap-2 ${selectedFilter === option.value
                    ? "bg-black text-white hover:bg-gray-800 border-black"
                    : ""
                    }`}

                >
                  <Filter className="w-4 h-4" />
                  {option.label}
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {option.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Lending List */}
          <div className="space-y-4">
            {filteredBooks.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                  <p className="text-gray-500">Try adjusting filters or search terms</p>
                </div>
              </Card>
            ) : (
              filteredBooks.map((book) => (

                <Card key={book.id} className="relative overflow-visible flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition">

                  {/* ⋯ more */}
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => toggleMenu(e, book.id)}
                      className="border-none text-black hover:bg-black hover:text-white"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {openId === book.id && (
                      <div
                        className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => router.push(`/lending/edit/${book.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => onHistory(book.id)}
                        >
                          History
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={async (e) => {
                            e.stopPropagation();

                            if (!confirm("Are you sure you want to delete this book?")) return;

                            const success = await deleteBook(book.id);
                            if (success) {
                              setItems((prev) => prev.filter((b) => b.id !== book.id));
                              alert("Book deleted successfully.");
                            } else {
                              alert("Failed to delete book.");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cover img */}
                  <div className="w-28 h-36 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {book.coverImgUrl ? (
                      <img
                        src={book.coverImgUrl}
                        alt={book.titleOr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Cover
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* title */}
                      <h3 className="text-lg font-semibold text-black">{book.titleOr}</h3>

                      {/* status +  createTime */}
                      <p className="text-sm text-gray-600 mt-1">
                        {book.status === "listed" && (
                          <span className="text-green-600 font-medium">Listed</span>
                        )}
                        {book.status === "unlisted" && (
                          <span className="text-red-600 font-medium">Unlisted</span>
                        )}
                        {book.status === "lent" && (
                          <span className="text-blue-600 font-medium">Lend Out</span>
                        )}
                        {book.status === "sold" && (
                          <span className="text-gray-500 font-medium">Sold</span>
                        )}
                        {" · "}Listed on {new Date(book.dateAdded).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Button */}
                    <div className="flex gap-2 mt-3">
                      {book.status === "listed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-black text-black hover:bg-black hover:text-white"
                          onClick={async () => {
                            await updateBook(book.id, { status: "unlisted" });
                            setItems((prev) =>
                              prev.map((b) => (b.id === book.id ? { ...b, status: "unlisted" } : b))
                            );
                          }}
                        >
                          Unlist
                        </Button>
                      )}
                      {book.status === "unlisted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-black text-black hover:bg-black hover:text-white"
                          onClick={async () => {
                            await updateBook(book.id, { status: "listed" });
                            setItems((prev) =>
                              prev.map((b) => (b.id === book.id ? { ...b, status: "listed" } : b))
                            );
                          }}
                        >
                          List
                        </Button>
                      )}
                      {book.status === "lent" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-black text-black hover:bg-black hover:text-white"
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-gray-800"
                          >
                            Message Borrower
                          </Button>

                          {/* due date info when book lent-out */}

                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}