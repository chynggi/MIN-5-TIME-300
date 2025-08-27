"use client";
import { Suspense } from "react";
import FriendsPageContent from "./FriendsPageContent";

export default function FriendsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    }>
      <FriendsPageContent />
    </Suspense>
  );
}
