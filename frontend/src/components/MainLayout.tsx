import React from "react";
import Navigation from "./Navigation";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navigation />
      <main className="flex-1 w-full max-w-4xl mx-auto p-4">{children}</main>
    </div>
  );
};

export default MainLayout;
