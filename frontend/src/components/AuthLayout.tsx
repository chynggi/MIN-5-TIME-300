import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="bg-white/90 rounded-lg shadow-lg p-0 md:p-0 w-full max-w-md md:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
