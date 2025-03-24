import React, { useState, useEffect } from 'react';

function Timer({ initialTime, isRunning: propIsRunning, onStart, onStop, onReset, onTimeUpdate }) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(propIsRunning);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  useEffect(() => {
    setIsRunning(propIsRunning);
  }, [propIsRunning]);

  useEffect(() => {
    let intervalId;

    if (isRunning && time > 0) {
      intervalId = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else {
      clearInterval(intervalId);
      if (time === 0) {
        onStop?.(); // Call onStop when time runs out
      }
    }

    onTimeUpdate?.(time); // Inform parent about time updates

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [isRunning, time, onStop, onTimeUpdate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onStart?.();
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop?.();
  };

  const handleReset = () => {
    setTime(initialTime);
    setIsRunning(false);
    onReset?.();
  };

  return (
    <div className="mb-4">
      <div className="text-xl font-semibold">{formatTime(time)}</div>
      {!isRunning ? (
        <button onClick={handleStart} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
          Start
        </button>
      ) : (
        <button onClick={handleStop} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2">
          Stop
        </button>
      )}
      <button onClick={handleReset} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">
        Reset
      </button>
    </div>
  );
}

export default Timer;