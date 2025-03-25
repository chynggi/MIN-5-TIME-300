import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg"
    >
      <motion.div
        className="text-6xl font-bold mb-8"
        animate={{ scale: isRunning ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </motion.div>
      
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-2 rounded-full font-semibold ${
            isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          onClick={isRunning ? handleStop : handleStart}
        >
          {isRunning ? '일시정지' : '시작'}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-2 rounded-full bg-gray-200 hover:bg-gray-300 font-semibold"
          onClick={handleReset}
        >
          리셋
        </motion.button>
      </div>

      <AnimatePresence>
        {time <= 60 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 text-red-500 font-semibold"
          >
            {time === 0 ? '시간이 종료되었습니다!' : '1분 미만 남았습니다!'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Timer;