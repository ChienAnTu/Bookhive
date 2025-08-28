"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Profile",
    href: "/profile",
    match: "/profile",
    children: [
      { label: "Lending", href: "/lend/list", match: "/lend" },
      { label: "Borrowing", href: "/borrow/list", match: "/borrow" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-gray-50 p-4">
      <nav className="flex flex-col gap-4 text-sm">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.match);

          return (
            <div key={item.href} className="flex flex-col gap-2">
              {/* 一级菜单 */}
              <Link
                href={item.href}
                className={`${
                  isActive
                    ? "font-semibold text-black"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {item.label}
              </Link>

              {/* 二级菜单 */}
              {item.children && (
                <div className="ml-4 flex flex-col gap-2">
                  {item.children.map((child) => {
                    const isChildActive = pathname.startsWith(child.match);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`${
                          isChildActive
                            ? "font-semibold text-black"
                            : "text-gray-600 hover:text-black"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
