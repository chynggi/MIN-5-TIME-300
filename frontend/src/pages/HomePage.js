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
        const response = await api.get('/api/questions');
        if (response.data && response.data.question) {
          setDailyQuestion(response.data.question);
        } else if (response.data) {
          // response.data가 직접 질문 객체인 경우
          setDailyQuestion(response.data);
        } else {
          throw new Error('질문 데이터가 없습니다.');
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching daily question:", error);
        setError("오늘의 질문을 불러오는데 실패했습니다.");
        setLoading(false);
      }
    };

    fetchDailyQuestion();
  }, []);

  if (loading) {
    return <div className="text-center py-8">오늘의 질문을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">5분 일기에 오신 것을 환영합니다!</h2>
      <p className="mb-4">오늘의 질문으로 하루를 시작해보세요:</p>
      <div className="bg-gray-200 p-4 rounded-md">
        <p className="font-bold">{typeof dailyQuestion === 'object' ? dailyQuestion.question : dailyQuestion}</p>
      </div>
      <p className="mt-4">지금 바로 <Link to="/write" className="text-blue-500 hover:underline">일기 쓰기</Link>를 시작해보세요.</p>
    </div>
  );
}

export default HomePage;