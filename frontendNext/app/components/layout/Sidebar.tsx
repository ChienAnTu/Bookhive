"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, BookOpen, Library, Truck } from "lucide-react";

const navItems = [
  {
    label: "Profile",
    href: "/profile",
    match: "/profile",
    icon: User,
    children: [
      { label: "Lending", href: "/lend/list", match: "/lend", icon: Library },
      { label: "Borrowing", href: "/borrow/list", match: "/borrow", icon: BookOpen },
      { label: "Shipping", href: "/shipping/list", match: "/shipping", icon: Truck },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.match);
        const Icon = item.icon;

        return (
          <div key={item.href} className="flex flex-col">
            {/* 一级：Profile */}
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-2 py-2 text-sm font-bold transition
                ${isActive ? "text-black" : "text-gray-700 hover:text-black"}`}
            >
              <Icon size={18} className="text-gray-500" />
              {item.label}
            </Link>

            {/* 二级：Lending / Borrowing / Shipping */}
            <div className="ml-6 mt-1 flex flex-col gap-1">
              {item.children?.map((child) => {
                const childActive = pathname.startsWith(child.match);
                const ChildIcon = child.icon;

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition
                      ${
                        childActive
                          ? "bg-gray-200 font-semibold text-black"
                          : "text-gray-600 hover:bg-gray-700 hover:text-white"
                      }`}
                  >
                    <ChildIcon size={16} className="text-gray-400" />
                    {child.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
