"use client";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

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

interface AIModel {
  id: string;
  name: string;
  description: string;
  confidence: string;
  icon: string;
}

const availableModels: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "빠르고 효율적인 질문 생성",
    confidence: "90%",
    icon: "🤖"
  },
  {
    id: "claude-sonnet-4", 
    name: "Claude Sonnet 4",
    description: "깊이 있는 분석과 고품질 질문",
    confidence: "95%",
    icon: "🧠"
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    description: "창의적이고 맥락적인 질문",
    confidence: "92%", 
    icon: "⚡"
  }
];

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
  const [selectedModel, setSelectedModel] = useState<string>("claude-sonnet-4"); // 기본값은 Claude
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [enabledModels, setEnabledModels] = useState<string[]>([]);

  // 초기 설정: 사용 가능한 모델 조회
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  // 초기 질문 생성
  useEffect(() => {
    if (enabledModels.length > 0) {
      generateQuestions();
    }
  }, [enabledModels]);

  // 드롭다운 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showModelSelector && !target.closest('.model-selector')) {
        setShowModelSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSelector]);

  const fetchAvailableModels = async () => {
    try {
      const response = await api.get("/questions/models");
      const { enabledModels: enabled, defaultModel } = response.data;
      setEnabledModels(enabled);
      if (enabled.includes(defaultModel)) {
        setSelectedModel(defaultModel);
      } else if (enabled.length > 0) {
        setSelectedModel(enabled[0]);
      }
    } catch (error) {
      console.error("모델 정보 조회 실패:", error);
      // 폴백: 모든 모델 활성화
      setEnabledModels(["gemini-2.5-flash", "claude-sonnet-4", "gpt-5"]);
    }
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      // 실제 API 호출
      const response = await api.post(`/questions/generate?model=${selectedModel}`);
      const questionData = response.data;
      
      // 단일 질문을 여러 질문으로 확장 (임시)
      const questionList = [
        questionData.question,
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
      }, 1000);
    } catch (error) {
      console.error("질문 생성 실패:", error);
      // 폴백: 기본 질문 사용 (선택된 모델에 따라 다른 기본 질문)
      let fallbackQuestions: string[] = [];
      
      if (selectedModel === "claude-sonnet-4") {
        fallbackQuestions = [
          "오늘 당신의 마음을 가장 깊이 움직인 순간은 무엇이었나요?",
          "지금 이 순간 당신이 느끼는 감정을 한 단어로 표현한다면?",
          "오늘 하루 중 가장 의미 있었던 대화나 만남이 있었나요?",
          "당신이 오늘 가장 감사하게 생각하는 것은 무엇인가요?",
          "오늘의 경험이 앞으로의 당신에게 어떤 영향을 줄 것 같나요?"
        ];
      } else if (selectedModel === "gpt-5") {
        fallbackQuestions = [
          "오늘 하루를 한 편의 영화로 만든다면 어떤 장르가 될까요?",
          "지금 당신의 마음 상태를 날씨로 표현한다면?",
          "오늘 새롭게 발견한 것이나 배운 점이 있다면 무엇인가요?",
          "만약 오늘을 다시 살 수 있다면 무엇을 다르게 하고 싶나요?",
          "오늘 하루 중 가장 창의적이었던 순간은 언제였나요?"
        ];
      } else {
        fallbackQuestions = [
          "오늘 가장 기억에 남는 순간은 무엇이었나요?",
          "오늘 하루 중 가장 감사했던 일은 무엇인가요?",
          "오늘 새롭게 배운 것이나 깨달은 점이 있다면?",
          "오늘 만난 사람들 중 특별히 기억에 남는 사람이 있나요?",
          "오늘의 날씨가 당신의 기분에 어떤 영향을 주었나요?"
        ];
      }
      
      setTimeout(() => {
        const questionsData = fallbackQuestions.map((text, index) => ({
          id: `question-${index}`,
          text,
          answered: false,
          answer: "",
          answerType: "text" as const,
          emoji: ""
        }));
        setQuestions(questionsData);
        setIsGenerating(false);
      }, 1000);
    }
  };

  const selectQuestion = (index: number) => {
    if (showAnswerInput && currentQuestionIndex === index) {
      // 이미 열려있는 질문을 다시 클릭하면 닫기
      setShowAnswerInput(false);
      setCurrentAnswer("");
      setSelectedEmoji("");
      setAnswerType("text");
    } else {
      // 다른 질문 클릭 시 해당 질문 열기
      setCurrentQuestionIndex(index);
      setShowAnswerInput(true);
      setCurrentAnswer(questions[index]?.answer || "");
      setAnswerType("text");
      setSelectedEmoji("");
    }
  };

  const saveAnswer = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = {
      ...updatedQuestions[currentQuestionIndex],
      answered: true,
      answer: currentAnswer,
      answerType: "text",
      emoji: ""
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
    const currentModel = availableModels.find(m => m.id === selectedModel);
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">{currentModel?.icon || "🤖"}</div>
        <h2 className="text-lg font-bold">
          {currentModel?.name || "AI"}가 개인화된 질문을 생성하고 있습니다...
        </h2>
        <p className="text-gray-600">
          {currentModel?.description || "잠시만 기다려주세요"}
        </p>
        <div className="flex justify-center">
          <div className="animate-pulse bg-gradient-to-r from-blue-200 to-purple-200 h-4 w-64 rounded-full"></div>
        </div>
        <div className="text-sm text-gray-500">
          신뢰도: {currentModel?.confidence || "90%"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 뒤로
          </button>
          {/* AI 모델 선택 버튼 */}
          <div className="relative model-selector">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
            >
              <span>{availableModels.find(m => m.id === selectedModel)?.icon || "🤖"}</span>
              <span>{availableModels.find(m => m.id === selectedModel)?.name || "AI 모델"}</span>
              <span className="text-xs">▼</span>
            </button>
            
            {/* 모델 선택 드롭다운 */}
            {showModelSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[280px]">
                {availableModels.filter(model => enabledModels.includes(model.id)).map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setShowModelSelector(false);
                      // 모델 변경시 새로운 질문 생성
                      generateQuestions();
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedModel === model.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{model.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-800">{model.name}</span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {model.confidence}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <span className="text-blue-500 text-sm">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={generateQuestions}
            disabled={isGenerating}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            🔄 재생성
          </button>
        </div>
        <h1 className="text-lg font-bold text-gray-800">질문 기반 일기 작성</h1>
        <div className="text-sm text-gray-500">
          {answeredCount}/{totalCount}
        </div>
      </div>

      {/* 선택된 AI 모델 정보 */}
      {enabledModels.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-4 border border-blue-100">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {availableModels.find(m => m.id === selectedModel)?.icon || "🤖"}
            </span>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-800">
                  {availableModels.find(m => m.id === selectedModel)?.name || "AI 모델"}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  신뢰도 {availableModels.find(m => m.id === selectedModel)?.confidence || "90%"}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {availableModels.find(m => m.id === selectedModel)?.description || "AI가 개인화된 질문을 생성합니다"}
              </p>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => selectQuestion(index)}
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
                  </div>
                )}
              </div>
              {question.answered && (
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
          

          {/* 텍스트 입력 */}
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
              disabled={!currentAnswer.trim()}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              답변 저장
            </button>
          </div>
        </div>
      )}

      {/* 제목 입력 (필수) */}
      {answeredCount > 0 && !showAnswerInput && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">일기 제목 <span className="text-red-500">*</span></h3>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일기 제목을 입력하세요"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
            required
          />
          {!title.trim() && (
            <div className="text-xs text-red-500 mt-1">제목을 입력해야 일기를 저장할 수 있습니다.</div>
          )}
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
              disabled={!title.trim()}
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 disabled:opacity-50"
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
            disabled={!title.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            현재까지 답변으로 일기 저장하기 ({answeredCount}/{totalCount})
          </button>
        </div>
      )}
    </div>
  );
}
