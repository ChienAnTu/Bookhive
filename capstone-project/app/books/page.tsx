"use client";

import React, { useState } from 'react';
import Header from '../components/layout/Header';
import BookCard from '../components/common/BookCard';

// 模拟书籍数据
const mockBooks = [
  {
    id: '1',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    category: 'Fiction',
    imageUrl: '',
    condition: 'Like New',
    deposit: 25,
    serviceFee: 3,
    location: 'Seattle, WA',
    distance: '1093.2 km away',
    rating: 4.9,
    maxDays: 21,
    dateAdded: '1/15/2024',
    tags: ['Fiction', 'Contemporary Fiction', 'Philosophy'],
    deliveryMethod: 'both'
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self-Help',
    imageUrl: '',
    condition: 'Good',
    deposit: 20,
    serviceFee: 2,
    location: 'Portland, OR',
    distance: '850.5 km away',
    rating: 4.8,
    maxDays: 14,
    dateAdded: '1/20/2024',
    tags: ['Self-Help', 'Psychology', 'Productivity'],
    deliveryMethod: 'pickup'
  },
  {
    id: '3',
    title: 'Dune',
    author: 'Frank Herbert',
    category: 'Sci-Fi',
    imageUrl: '',
    condition: 'Like New',
    deposit: 30,
    serviceFee: 4,
    location: 'San Francisco, CA',
    distance: '1200.8 km away',
    rating: 4.7,
    maxDays: 30,
    dateAdded: '1/12/2024',
    tags: ['Sci-Fi', 'Space Opera', 'Classic'],
    deliveryMethod: 'both'
  },
  {
    id: '4',
    title: 'The Seven Husbands of Evelyn Hugo',
    author: 'Taylor Jenkins Reid',
    category: 'Fiction',
    imageUrl: '',
    condition: 'Good',
    deposit: 22,
    serviceFee: 3,
    location: 'Los Angeles, CA',
    distance: '1850.2 km away',
    rating: 4.6,
    maxDays: 21,
    dateAdded: '1/18/2024',
    tags: ['Fiction', 'Romance', 'Hollywood'],
    deliveryMethod: 'delivery'
  },
  {
    id: '5',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'History',
    imageUrl: '',
    condition: 'Like New',
    deposit: 28,
    serviceFee: 3,
    location: 'Berkeley, CA',
    distance: '1150.1 km away',
    rating: 4.5,
    maxDays: 28,
    dateAdded: '1/25/2024',
    tags: ['History', 'Anthropology', 'Philosophy'],
    deliveryMethod: 'both'
  },
  {
    id: '6',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    category: 'Sci-Fi',
    imageUrl: '',
    condition: 'New',
    deposit: 32,
    serviceFee: 4,
    location: 'San Diego, CA',
    distance: '2100.3 km away',
    rating: 4.9,
    maxDays: 21,
    dateAdded: '1/22/2024',
    tags: ['Sci-Fi', 'Space', 'Adventure'],
    deliveryMethod: 'both'
  },
  {
    id: '7',
    title: 'Educated',
    author: 'Tara Westover',
    category: 'Biography',
    imageUrl: '',
    condition: 'Good',
    deposit: 24,
    serviceFee: 3,
    location: 'Phoenix, AZ',
    distance: '1400.5 km away',
    rating: 4.8,
    maxDays: 25,
    dateAdded: '1/10/2024',
    tags: ['Biography', 'Memoir', 'Education'],
    deliveryMethod: 'both'
  },
  {
    id: '8',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    category: 'Design',
    imageUrl: '',
    condition: 'Like New',
    deposit: 26,
    serviceFee: 3,
    location: 'Austin, TX',
    distance: '1600.8 km away',
    rating: 4.4,
    maxDays: 20,
    dateAdded: '1/28/2024',
    tags: ['Design', 'UX', 'Psychology'],
    deliveryMethod: 'pickup'
  }
];

export default function BooksPage() {
  const handleViewDetails = (bookId: string) => {
    // 跳转到书籍详情页
    window.location.href = `/books/${bookId}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gray-50">
        {/* 减少两侧留白：从 px-4 sm:px-6 lg:px-8 改为 px-2 sm:px-3 lg:px-4 */}
        <div className="w-full px-2 sm:px-3 lg:px-4 py-6">
          
          {/* 只保留书籍数量显示 */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              {mockBooks.length} books found
            </p>
          </div>

          {/* 书籍网格 - 调整间距 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {mockBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}