import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function HomePage() {
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyQuestion = async () => {
      try {
        const response = await api.get('/api/daily-question'); // Replace with your actual API endpoint
        setDailyQuestion(response.data.question);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching daily question:", error);
        setError("Failed to load daily question.");
        setLoading(false);
      }
    };

    fetchDailyQuestion();
  },);

  if (loading) {
    return <div className="text-center py-8">Loading daily question...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Welcome to MIN 5 TIME 300!</h2>
      <p className="mb-4">Here's your daily prompt to get you started:</p>
      <div className="bg-gray-200 p-4 rounded-md">
        <p className="font-bold">{dailyQuestion}</p>
      </div>
      <p className="mt-4">Ready to reflect? Head over to the <Link to="/write" className="text-blue-500 hover:underline">Write</Link> page.</p>
    </div>
  );
}

export default HomePage;