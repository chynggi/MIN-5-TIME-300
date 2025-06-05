import React from "react";
import MainLayout from "./MainLayout";

interface DomainLayoutProps {
  children: React.ReactNode;
}

const DomainLayout: React.FC<DomainLayoutProps> = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default DomainLayout;
