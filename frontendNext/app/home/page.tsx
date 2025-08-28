import React from "react";
import NewReleases from "../components/common/NewReleases";
// import { getCurrentUser } from "@/app/data/mockData";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  } else if (hour < 18) {
    return "Good afternoon";
  } else if (hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
  }
}

export default function HomePage() {
  //   const currentUser = getCurrentUser();
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {greeting}！
          </h1>
          <p className="text-lg text-gray-600">Welcome back</p>
        </div>

        {/* New Releases */}
        <NewReleases />
        {/* <CloseToYou /> */}
      </div>
    </div>
  );
}
