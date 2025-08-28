"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";

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
  { id: 4, title: "Harry Potter 4", status: "LendOut", listedDate: "2025-09-25", dueDate: "2025-09-25" },
  { id: 5, title: "Harry Potter 4", status: "LendOut", listedDate: "2025-09-25", dueDate: "2025-09-25", overdue: true },
];

export default function LendingListPage() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter((book) =>
    book.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button className="px-3 py-2 bg-gray-700 text-white rounded">
          <Search size={16} />
        </button>
        <button className="p-2 border rounded">
          <Filter size={18} />
        </button>
      </div>

      {/* Lending List */}
      {filtered.map((book) => (
        <div key={book.id} className="border rounded p-3 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{book.title}</h3>
              <p className="text-sm text-gray-600">
                {book.status === "Listed" && (
                  <span className="text-green-600 font-semibold">Listed</span>
                )}
                {book.status === "Unlisted" && (
                  <span className="text-green-600 font-semibold">Unlisted</span>
                )}
                {book.status === "LendOut" && (
                  <span className="text-green-600 font-semibold">Lend Out</span>
                )}
                {" | "}Listed On {book.listedDate}
              </p>
              {book.dueDate && (
                <p
                  className={`text-sm ${
                    book.overdue ? "text-red-600 font-bold" : "text-gray-700"
                  }`}
                >
                  Due Date {book.dueDate}
                </p>
              )}
            </div>
            <button className="p-1 text-gray-600">⋮</button>
          </div>

          <div className="flex gap-2">
            {book.status === "Listed" && (
              <button className="px-4 py-1 bg-gray-700 text-white rounded">
                Unlist
              </button>
            )}
            {book.status === "Unlisted" && (
              <button className="px-4 py-1 bg-gray-700 text-white rounded">
                List
              </button>
            )}
            {book.status === "LendOut" && (
              <>
                <button className="px-4 py-1 bg-gray-700 text-white rounded">
                  Detail
                </button>
                <button className="px-4 py-1 bg-gray-700 text-white rounded">
                  Message Borrower
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
