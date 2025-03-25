import React, { useState, useRef, useEffect } from 'react';
import Timer from '../components/Timer';
import api from '../services/api';

function WritingPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const textareaRefs = useRef([]);

  useEffect(() => {
    fetchDailyQuestions();
  }, []);

  const fetchDailyQuestions = async () => {
    try {
      const response = await api.get('/api/questions/daily');
      setQuestions(response.data);
      // 각 질문에 대한 빈 답변 객체 초기화
      const initialAnswers = {};
      response.data.forEach(question => {
        initialAnswers[question.id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    if (!hasStartedTyping) {
      setHasStartedTyping(true);
      setIsTimerRunning(true);
    }
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSaveEntry = async () => {
    try {
      // 모든 답변을 하나의 텍스트로 결합
      const entryText = questions.map(question => 
        `Q: ${question.text}\nA: ${answers[question.id]}\n\n`
      ).join('');

      const response = await api.post('/api/entries', { text: entryText });
      console.log("Entry saved:", response.data);
      // 답변 초기화
      const initialAnswers = {};
      questions.forEach(question => {
        initialAnswers[question.id] = '';
      });
      setAnswers(initialAnswers);
      setHasStartedTyping(false);
      setIsTimerRunning(false);
      setTimeRemaining(300);
    } catch (error) {
      console.error("Error saving entry:", error);
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
      alert("시간이 다 되었습니다!");
    }
  };

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">오늘의 일기</h2>
      <Timer
        initialTime={300}
        isRunning={isTimerRunning}
        onStop={handleTimerStop}
        onReset={handleTimerReset}
        onTimeUpdate={handleTimeUpdate}
      />
      
      <div className="mt-6 space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <h3 className="text-lg font-medium">
              질문 {index + 1}: {question.text}
            </h3>
            <textarea
              ref={el => textareaRefs.current[index] = el}
              value={answers[question.id]}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-500"
              placeholder="여기에 답변을 작성하세요..."
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveEntry}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-6 w-full"
        disabled={Object.values(answers).some(answer => !answer.trim())}
      >
        일기 저장하기
      </button>
    </div>
  );
}

export default WritingPage;