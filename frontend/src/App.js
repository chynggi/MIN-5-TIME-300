import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DiaryPage from "./pages/DiaryPage";
import SharedDiariesPage from "./pages/SharedDiariesPage";
import ProfilePage from "./pages/ProfilePage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/shared" element={<SharedDiariesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
