import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-blue-500 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">MIN 5 TIME 300</Link>
        <ul className="flex space-x-4">
          <li><Link to="/" className="hover:text-blue-300">Home</Link></li>
          <li><Link to="/write" className="hover:text-blue-300">Write</Link></li>
          <li><Link to="/shared" className="hover:text-blue-300">Shared Entries</Link></li>
          <li><Link to="/profile" className="hover:text-blue-300">Profile</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;