import React, { useState, useRef } from 'react';
import Timer from '../components/Timer';
import api from '../services/api';

function WritingPage() {
  const [entryText, setEntryText] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const textareaRef = useRef(null);

  const handleSaveEntry = async () => {
    try {
      const response = await api.post('/api/entries', { text: entryText }); // Replace with your API endpoint
      console.log("Entry saved:", response.data);
      setEntryText(''); // Clear the textarea after saving
      // Optionally provide feedback to the user
    } catch (error) {
      console.error("Error saving entry:", error);
      // Optionally display an error message to the user
    }
  };

  const handleTimerStart = () => {
    setIsTimerRunning(true);
    if (textareaRef.current) {
      textareaRef.current.focus(); // Focus on the textarea when the timer starts
    }
  };

  const handleTimerStop = () => {
    setIsTimerRunning(false);
  };

  const handleTimerReset = () => {
    setIsTimerRunning(false);
    setTimeRemaining(300);
  };

  const handleTimeUpdate = (newTime) => {
    setTimeRemaining(newTime);
    if (newTime === 0) {
      setIsTimerRunning(false);
      alert("Time's up!"); // Or provide a more subtle notification
    }
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Write for 5 Minutes</h2>
      <Timer
        initialTime={300}
        isRunning={isTimerRunning}
        onStart={handleTimerStart}
        onStop={handleTimerStop}
        onReset={handleTimerReset}
        onTimeUpdate={handleTimeUpdate}
      />
      <textarea
        ref={textareaRef}
        value={entryText}
        onChange={(e) => setEntryText(e.target.value)}
        className="w-full h-64 p-3 border border-gray-300 rounded-md mt-4 focus:outline-none focus:ring focus:border-blue-500"
        placeholder="Start writing here..."
        disabled={!isTimerRunning && timeRemaining < 300} // Disable if timer hasn't started or has finished
      />
      <button
        onClick={handleSaveEntry}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
        disabled={!entryText.trim()} // Disable if the entry is empty
      >
        Save Entry
      </button>
    </div>
  );
}

export default WritingPage;