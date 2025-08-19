"use client";
import { useState, useEffect } from "react";

interface Question {
  id: string;
  text: string;
  answered: boolean;
  answer: string;
  answerType: "text" | "emoji";
  emoji?: string;
}

interface AIQuestionWriterProps {
  onComplete: (data: { title: string; content: string; questionId: string }) => void;
  onBack: () => void;
}

const emojiOptions = ["😊", "😢", "😡", "😴", "🤔", "😍", "😎", "🥳", "😅", "🤗", "😰", "🙄"];

export default function AIQuestionWriter({ onComplete, onBack }: AIQuestionWriterProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerType, setAnswerType] = useState<"text" | "emoji">("text");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [startTime, setStartTime] = useState<number>(Date.now());

  // 초기 질문 생성
  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      // TODO: 실제 API 호출
      // const response = await api.post("/questions/generate-multiple");
      
      // 임시 데이터 - 5가지 질문 제공
      const questionList = [
        "오늘 가장 기억에 남는 순간은 무엇이었나요?",
        "오늘 하루 중 가장 감사했던 일은 무엇인가요?",
        "오늘 새롭게 배운 것이나 깨달은 점이 있다면?",
        "오늘 만난 사람들 중 특별히 기억에 남는 사람이 있나요?",
        "오늘의 날씨가 당신의 기분에 어떤 영향을 주었나요?"
      ];
      
      setTimeout(() => {
        const questionsData = questionList.map((text, index) => ({
          id: `question-${index}`,
          text,
          answered: false,
          answer: "",
          answerType: "text" as const,
          emoji: ""
        }));
        setQuestions(questionsData);
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("질문 생성 실패:", error);
      setIsGenerating(false);
    }
  };

  const selectQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowAnswerInput(true);
    setCurrentAnswer(questions[index]?.answer || "");
    setAnswerType(questions[index]?.answerType || "text");
    setSelectedEmoji(questions[index]?.emoji || "");
  };

  const saveAnswer = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      answered: true,
      answer: answerType === "text" ? currentAnswer : selectedEmoji,
      answerType,
      emoji: answerType === "emoji" ? selectedEmoji : ""
    };
    setQuestions(updatedQuestions);
    setShowAnswerInput(false);
    setCurrentAnswer("");
    setSelectedEmoji("");
  };

  const cancelAnswer = () => {
    setShowAnswerInput(false);
    setCurrentAnswer("");
    setSelectedEmoji("");
    setAnswerType("text");
  };

  const generateDiary = () => {
    // 모든 질문과 답변을 하나의 일기로 결합
    let content = "";
    let questionIds = "";
    
    // 제목이 있으면 맨 앞에 추가
    if (title.trim()) {
      content = `${title}\n\n`;
    }
    
    questions.forEach((q, index) => {
      if (q.answered) {
        content += `${q.text}\n${q.answer}\n\n`;
        questionIds += q.id + ",";
      }
    });

    // 제목이 없으면 첫 번째 질문의 답변으로 제목 생성
    let finalTitle = title;
    if (!finalTitle && questions[0]?.answered) {
      finalTitle = questions[0].answer.slice(0, 20) + "...";
      // 이미 content에 포함되어 있으므로 제목을 별도로 추가하지 않음
    }

    onComplete({ 
      title: finalTitle || "오늘의 일기", 
      content: content.trim(), 
      questionId: questionIds.slice(0, -1)
    });
  };

  const answeredCount = questions.filter(q => q.answered).length;
  const totalCount = questions.length;
  const isAllAnswered = answeredCount === totalCount && totalCount > 0;

  if (isGenerating) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-lg font-bold">AI가 개인화된 질문을 생성하고 있습니다...</h2>
        <p className="text-gray-600">잠시만 기다려주세요</p>
        <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 뒤로
        </button>
        <h1 className="text-lg font-bold text-gray-800">질문 기반 일기 작성</h1>
        <div className="text-sm text-gray-500">
          {answeredCount}/{totalCount}
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
        ></div>
      </div>

      {/* 질문 바 (Question Bar) */}
      <div className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">오늘의 질문들</h3>
        <div className="space-y-2">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                question.answered 
                  ? "bg-green-50 border-green-200" 
                  : currentQuestionIndex === index && showAnswerInput
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => !showAnswerInput && selectQuestion(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                    question.answered ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                  }`}>
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-700 flex-1">{question.text}</p>
                </div>
                {question.answered && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-600">✓ 완료</span>
                    {question.answerType === "emoji" && (
                      <span className="text-lg">{question.emoji}</span>
                    )}
                  </div>
                )}
              </div>
              {question.answered && question.answerType === "text" && (
                <div className="mt-2 ml-9">
                  <p className="text-xs text-gray-600 bg-white rounded p-2 line-clamp-2">
                    {question.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 답변 입력 영역 */}
      {showAnswerInput && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">
            질문 {currentQuestionIndex + 1}: {questions[currentQuestionIndex]?.text}
          </h3>
          
          {/* 답변 유형 선택 */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setAnswerType("text")}
              className={`px-4 py-2 rounded-lg font-medium ${
                answerType === "text" 
                  ? "bg-blue-500 text-white" 
                  : "bg-white text-gray-600 border"
              }`}
            >
              📝 텍스트로 답변
            </button>
            <button
              onClick={() => setAnswerType("emoji")}
              className={`px-4 py-2 rounded-lg font-medium ${
                answerType === "emoji" 
                  ? "bg-blue-500 text-white" 
                  : "bg-white text-gray-600 border"
              }`}
            >
              😊 이모티콘으로 답변
            </button>
          </div>

          {/* 텍스트 입력 */}
          {answerType === "text" && (
            <div className="mb-4">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="이 질문에 대한 답변을 자유롭게 작성해보세요..."
                className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {currentAnswer.length}/500자
              </div>
            </div>
          )}

          {/* 이모티콘 선택 */}
          {answerType === "emoji" && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">이 질문에 대한 감정을 이모티콘으로 표현해보세요:</p>
              <div className="grid grid-cols-6 gap-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`p-3 text-2xl rounded-lg border transition-all ${
                      selectedEmoji === emoji 
                        ? "bg-blue-500 border-blue-500 transform scale-110" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 답변 저장 버튼 */}
          <div className="flex space-x-2">
            <button
              onClick={cancelAnswer}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              취소
            </button>
            <button
              onClick={saveAnswer}
              disabled={
                (answerType === "text" && !currentAnswer.trim()) ||
                (answerType === "emoji" && !selectedEmoji)
              }
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              답변 저장
            </button>
          </div>
        </div>
      )}

      {/* 제목 입력 (선택사항) */}
      {answeredCount > 0 && !showAnswerInput && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">일기 제목 (선택사항)</h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하지 않으면 자동으로 생성됩니다"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
          />
        </div>
      )}

      {/* 완료 버튼 */}
      {isAllAnswered && !showAnswerInput && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-center">
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="font-semibold text-green-800 mb-2">모든 질문에 답변하셨습니다!</h3>
            <p className="text-sm text-green-600 mb-4">일기를 저장하시겠습니까?</p>
            <button
              onClick={generateDiary}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600"
            >
              일기 완성하기
            </button>
          </div>
        </div>
      )}

      {/* 부분 저장 버튼 */}
      {answeredCount > 0 && !isAllAnswered && !showAnswerInput && (
        <div className="text-center">
          <button
            onClick={generateDiary}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            현재까지 답변으로 일기 저장하기 ({answeredCount}/{totalCount})
          </button>
        </div>
      )}
    </div>
  );
}
