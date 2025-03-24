import React from 'react';

function DiaryCard({ entry }) {
  return (
    <div className="bg-gray-100 p-4 rounded-md shadow-sm">
      <p className="text-gray-800">{entry.text.substring(0, 150)}...</p> {/* Display a snippet */}
      <p className="text-sm text-gray-500 mt-2">Shared on: {new Date(entry.createdAt).toLocaleDateString()}</p> {/* Assuming your backend provides a createdAt field */}
      {/* You might want to add a "Read More" button or similar */}
    </div>
  );
}

export default DiaryCard;