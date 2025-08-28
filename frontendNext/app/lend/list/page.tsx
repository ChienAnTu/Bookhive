"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Input from "../../components/ui/Input";

interface LendingItem {
  id: number;
  title: string;
  status: "Listed" | "Unlisted" | "LendOut";
  listedDate: string;
  dueDate?: string;
  overdue?: boolean;
}

const mockData: LendingItem[] = [
  { id: 1, title: "Harry Potter 1", status: "Listed", listedDate: "2025-09-25" },
  { id: 2, title: "Harry Potter 2", status: "LendOut", listedDate: "2025-09-25", dueDate: "2025-09-25" },
  { id: 3, title: "Harry Potter 3", status: "Unlisted", listedDate: "2025-09-25" },
];

export default function LendingListPage() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <Input
          variant="search"
          placeholder="Search your Lend Order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="p-2 border rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition">
          <Filter size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Lending List */}
      <div className="space-y-4">
        {filtered.map((book) => (
          <div
            key={book.id}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-gray-300 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-sm text-gray-600">
                  {book.status === "Listed" && (
                    <span className="text-green-600 font-medium">Listed</span>
                  )}
                  {book.status === "Unlisted" && (
                    <span className="text-gray-500 font-medium">Unlisted</span>
                  )}
                  {book.status === "LendOut" && (
                    <span className="text-blue-600 font-medium">Lend Out</span>
                  )}
                  {" | "}Listed On {book.listedDate}
                </p>
                {book.dueDate && (
                  <p
                    className={`text-sm ${
                      book.overdue ? "text-red-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    Due Date {book.dueDate}
                  </p>
                )}
              </div>
              <button className="text-gray-400 hover:text-gray-600">⋮</button>
            </div>

            <div className="flex gap-2 mt-3">
              {book.status === "Listed" && (
                <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                  Unlist
                </button>
              )}
              {book.status === "Unlisted" && (
                <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                  List
                </button>
              )}
              {book.status === "LendOut" && (
                <>
                  <button className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                    Detail
                  </button>
                  <button className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-gray-800">
                    Message Borrower
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
