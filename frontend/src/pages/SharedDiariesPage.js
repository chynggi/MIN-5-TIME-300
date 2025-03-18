import React, { useEffect, useState } from "react";
import axios from "axios";

function SharedDiariesPage() {
  const [sharedDiaries, setSharedDiaries] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/shared")
      .then(response => setSharedDiaries(response.data))
      .catch(error => console.error("Error fetching shared diaries:", error));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-primary mb-4">📢 공유된 일기</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sharedDiaries.map((diary, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow-md">
            <p className="text-gray-700">{diary.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SharedDiariesPage;
