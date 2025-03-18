import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-primary p-4 text-white shadow-md">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="text-xl font-bold">📖 MIN 5 TIME 300</Link>
        <div className="space-x-4">
          <Link to="/diary" className="hover:text-accent">✍️ 일기 작성</Link>
          <Link to="/shared" className="hover:text-accent">📢 공유된 일기</Link>
          <Link to="/profile" className="hover:text-accent">👤 프로필</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
