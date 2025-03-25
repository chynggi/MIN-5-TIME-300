import React from 'react';
import { motion } from 'framer-motion';

const DiaryCard = ({ diary }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-lg shadow-md mb-4 hover:shadow-lg transition-shadow"
    >
      <h3 className="text-xl font-semibold mb-2">{diary.title}</h3>
      <p className="text-gray-600">{diary.content}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">{new Date(diary.created_at).toLocaleDateString()}</span>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">감정 점수:</span>
          <span className="text-sm font-semibold">{diary.rating}/5</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DiaryCard;