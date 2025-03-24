import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import WritingPage from './pages/WritingPage';
import SharedDiariesPage from './pages/SharedDiariesPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="container mx-auto py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/write" element={<WritingPage />} />
          <Route path="/shared" element={<SharedDiariesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;