import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DiaryCard from '../components/DiaryCard';

function SharedDiariesPage() {
  const [sharedEntries, setSharedEntries] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedEntries = async () => {
      try {
        const response = await api.get('/api/shared-entries'); // Replace with your API endpoint
        setSharedEntries(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching shared entries:", error);
        setError("Failed to load shared entries.");
        setLoading(false);
      }
    };

    fetchSharedEntries();
  },);

  if (loading) {
    return <div className="text-center py-8">Loading shared entries...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Shared Journal Entries</h2>
      {sharedEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedEntries.map(entry => (
            <DiaryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p>No shared entries yet.</p>
      )}
    </div>
  );
}

export default SharedDiariesPage;