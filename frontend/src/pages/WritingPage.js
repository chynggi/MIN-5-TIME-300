import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Timer from '../components/Timer';
import api from '../services/api';
import Modal from '../components/Modal';

// 에러 메시지 컴포넌트
const ErrorMessage = ({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
    <span>{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-700">
        ✕
      </button>
    )}
  </div>
);

function WritingPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const textareaRefs = useRef([]);
  
  // 변수명 변경 및 새로운 상태 추가
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShared, setIsShared] = useState(false); // isPublic에서 isShared로 변경
  const [rating, setRating] = useState(5); // 평점 상태 추가
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null); // 에러 메시지 상태 추가
  const [hasEntryToday, setHasEntryToday] = useState(false); // 오늘 일기 작성 여부

  useEffect(() => {
    checkTodayEntry();
    fetchDailyQuestions();
  }, []);

  // 오늘 작성한 일기가 있는지 확인
  const checkTodayEntry = async () => {
    try {
      const response = await api.get('/api/check-today-entry');
      if (response.data.hasEntryToday) {
        setHasEntryToday(true);
        setErrorMessage('오늘은 이미 일기를 작성했습니다. 내일 다시 작성해주세요.');
      }
    } catch (error) {
      console.error("일기 확인 중 오류:", error);
    }
  };

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
      setErrorMessage("질문을 불러오는데 실패했습니다. 다시 시도해주세요.");
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

  // 저장 버튼 클릭 시 모달 표시
  const handleSaveClick = () => {
    // 오늘 이미 일기를 작성했으면 저장 불가
    if (hasEntryToday) {
      setErrorMessage('오늘은 이미 일기를 작성했습니다. 내일 다시 작성해주세요.');
      return;
    }
    setShowSaveOptions(true);
  };

  // handleSaveEntry 함수 수정
  const handleSaveEntry = async () => {
    setIsSaving(true);
    try {
      // 모든 답변을 하나의 텍스트로 결합
      const entryText = questions.map(question => 
        `Q: ${question.text}\nA: ${answers[question.id]}\n\n`
      ).join('');

      // 백엔드 API 엔드포인트와 요청 본문 구조 맞추기
      const response = await api.post('/api/diaries', { 
        content: entryText,
        isShared: isShared, // 변수명 변경 적용
        rating: rating // 평점 상태 사용
      });

      console.log("일기 저장됨:", response.data);
      
      // 저장 성공 표시
      setSaveSuccess(true);
      setHasEntryToday(true); // 오늘 일기 작성 완료 표시
      
      // 답변 초기화
      const initialAnswers = {};
      questions.forEach(question => {
        initialAnswers[question.id] = '';
      });
      setAnswers(initialAnswers);
      setHasStartedTyping(false);
      setIsTimerRunning(false);
      setTimeRemaining(300);
      
      // 모달 닫기
      setShowSaveOptions(false);
      setErrorMessage(null); // 에러 메시지 초기화
    } catch (error) {
      console.error("일기 저장 중 오류:", error);
      
      // 더 자세한 오류 메시지 제공
      const message = error.response?.data?.message || "일기 저장 중 오류가 발생했습니다.";
      setErrorMessage(message);
      
      // 특정 오류 유형에 대한 처리 추가
      if (message.includes('오늘은 이미 일기를 작성했습니다')) {
        setHasEntryToday(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 페이지 이동 처리
  const handleNavigation = (path) => {
    navigate(path);
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

  // 저장 옵션 모달
  const SaveOptionsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">일기 저장 옵션</h2>
        
        <div className="mb-6">
          <label className="flex items-center space-x-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isShared} // 변수명 변경
              onChange={() => setIsShared(!isShared)} // 변수명 변경
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">다른 사용자와 일기 공유하기</span>
          </label>
          <p className="text-sm text-gray-500">
            {isShared // 변수명 변경
              ? '이 일기는 다른 사용자들에게 공유되며, 다른 사용자들이 댓글을 남길 수 있습니다.' 
              : '이 일기는 비공개로 저장되며, 본인만 볼 수 있습니다.'}
          </p>
        </div>
        
        {/* 평점 선택 UI 추가 */}
        <div className="mb-6">
          <label className="block mb-2 text-gray-700">오늘의 기분 평점</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${rating === value 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {rating === 1 && '매우 나쁨'}
            {rating === 2 && '나쁨'}
            {rating === 3 && '보통'}
            {rating === 4 && '좋음'}
            {rating === 5 && '매우 좋음'}
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleSaveEntry}
            disabled={isSaving}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
          <button
            onClick={() => setShowSaveOptions(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors"
            disabled={isSaving}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );

  // 저장 성공 모달
  const SaveSuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <h2 className="text-xl font-semibold mb-4 mt-2">일기가 성공적으로 저장되었습니다!</h2>
          
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={() => handleNavigation('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              메인 페이지로 이동
            </button>
            <button
              onClick={() => handleNavigation('/shared')}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md transition-colors"
            >
              공유 일기 페이지로 이동
            </button>
            <button
              onClick={() => {
                setSaveSuccess(false);
                fetchDailyQuestions();
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition-colors"
            >
              새 일기 작성하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">오늘의 일기</h2>
      
      {/* 에러 메시지 표시 */}
      {errorMessage && (
        <ErrorMessage 
          message={errorMessage} 
          onDismiss={() => setErrorMessage(null)} 
        />
      )}
      
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
              disabled={hasEntryToday} // 오늘 이미 일기를 작성했으면 비활성화
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSaveClick}
        className={`font-bold py-2 px-4 rounded mt-6 w-full ${
          hasEntryToday 
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-700 text-white'
        }`}
        disabled={hasEntryToday || Object.values(answers).some(answer => !answer.trim())}
      >
        {hasEntryToday ? '오늘은 이미 일기를 작성했습니다' : '일기 저장하기'}
      </button>
      
      {/* 모달 컴포넌트 */}
      {showSaveOptions && <SaveOptionsModal />}
      {saveSuccess && <SaveSuccessModal />}
    </div>
  );
}

export default WritingPage;