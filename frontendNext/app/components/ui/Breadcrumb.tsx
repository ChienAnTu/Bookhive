"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string; // No href means current page
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center">
              {!isLast && item.href ? (
                <Link
                  href={item.href}
                  className="hover:underline text-gray-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700">{item.label}</span>
              )}

              {!isLast && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
