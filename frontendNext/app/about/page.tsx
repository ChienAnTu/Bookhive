"use client";

import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About BookHive</h1>
        <p className="text-xl text-gray-600">Connecting readers, sharing stories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Our Mission</h2>
          <p className="text-gray-600">
            BookHive is a community-driven platform that connects book lovers and
            enables them to share their personal libraries. We believe that books
            should be accessible to everyone, and sharing books can create
            meaningful connections within communities.
          </p>
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">How It Works</h2>
          <p className="text-gray-600">
            Members can list their books for lending, browse available books in
            their area, and arrange pickups or postal deliveries. Our platform
            makes it easy to discover new reads while ensuring safe and reliable
            transactions between users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">Share Your Books</h3>
          <p className="text-gray-600">
            List your books and share them with fellow readers in your community
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold mb-2">Build Connections</h3>
          <p className="text-gray-600">
            Meet other book enthusiasts and discover shared interests
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="text-3xl mb-4">♻️</div>
          <h3 className="text-xl font-semibold mb-2">Sustainable Reading</h3>
          <p className="text-gray-600">
            Promote sustainability by reusing and sharing books
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-8 rounded-xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Join Our Community
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto">
          Whether you're an avid reader or just getting started, BookHive welcomes
          you to join our growing community of book lovers. Start sharing your
          books today and be part of the reading revolution!
        </p>
      </div>
    </div>
  );
}