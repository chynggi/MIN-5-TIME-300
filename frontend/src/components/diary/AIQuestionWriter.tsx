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

  // 공통 버튼 스타일 (간단 유틸) - 추후 별도 컴포넌트화 가능
  const btn = {
    base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-3.5 py-2.5",
    lg: "text-sm px-5 py-3",
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-400",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
  };

  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  if (isGenerating) {
    const currentModel = availableModels.find(m => m.id === selectedModel);
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-7xl mb-6 animate-pulse">{currentModel?.icon || "🤖"}</div>
        <h2 className="text-2xl font-bold mb-2">
          {currentModel?.name || "AI"}가 개인화된 질문을 생성 중...
        </h2>
        <p className="text-gray-600 mb-6">
          {currentModel?.description || "잠시만 기다려주세요"}
        </p>
        <div className="w-full max-w-lg">
          <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          신뢰도: {currentModel?.confidence || "90%"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 상단 고정 헤더 */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200 px-2 md:px-4 py-3 rounded-md">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <button
            onClick={onBack}
            className={`${btn.base} ${btn.outline} ${btn.sm}`}
          >
            ← 뒤로
          </button>
          <div className="relative model-selector">
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className={`${btn.base} ${btn.outline} ${btn.sm} flex items-center space-x-2`}
            >
              <span>{availableModels.find(m => m.id === selectedModel)?.icon || "🤖"}</span>
              <span className="font-semibold hidden sm:inline">{availableModels.find(m => m.id === selectedModel)?.name || "AI 모델"}</span>
              <span className="text-[10px]">▼</span>
            </button>
            {showModelSelector && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 min-w-[300px] overflow-hidden">
                <div className="max-h-[360px] overflow-y-auto">
                  {availableModels.filter(m => enabledModels.includes(m.id)).map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setShowModelSelector(false); generateQuestions(); }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b last:border-b-0 ${selectedModel === model.id ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}
                    >
                      <span className="text-2xl pt-0.5">{model.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 truncate">{model.name}</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-medium">{model.confidence}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{model.description}</p>
                      </div>
                      {selectedModel === model.id && <span className="text-blue-600 text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={generateQuestions}
            disabled={isGenerating}
            className={`${btn.base} ${btn.secondary} ${btn.sm}`}
          >
            🔄 재생성
          </button>
          <div className="flex-1 min-w-[160px] hidden md:flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="text-xs font-medium text-gray-600 whitespace-nowrap">{answeredCount}/{totalCount}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {answeredCount > 0 && (
              <button
                onClick={generateDiary}
                disabled={!title.trim()}
                className={`${btn.base} ${btn.primary} ${btn.sm} hidden md:inline-flex`}
              >
                {isAllAnswered ? '일기 완성하기' : `부분 저장 (${answeredCount}/${totalCount})`}
              </button>
            )}
          </div>
        </div>
        {/* 모바일 진행률 */}
        <div className="mt-3 md:hidden flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[11px] text-gray-600 font-medium">{answeredCount}/{totalCount}</span>
        </div>
      </div>

      {/* 모델 정보 배너 */}
      {enabledModels.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl px-4 py-3 border border-blue-100 flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5">
            {availableModels.find(m => m.id === selectedModel)?.icon || '🤖'}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm md:text-base">
                {availableModels.find(m => m.id === selectedModel)?.name || 'AI 모델'}
              </span>
              <span className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-medium">
                신뢰도 {availableModels.find(m => m.id === selectedModel)?.confidence || '90%'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-1 leading-relaxed">
              {availableModels.find(m => m.id === selectedModel)?.description || 'AI가 개인화된 질문을 생성합니다'}
            </p>
          </div>
        </div>
      )}

      {/* 메인 2컬럼 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-[520px]">
        {/* 질문 리스트 */}
        <div className="md:col-span-2 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 text-sm md:text-base">오늘의 질문들</h3>
            <span className="text-[11px] text-gray-500 md:hidden">{answeredCount}/{totalCount}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {questions.map((question, index) => {
              const active = currentQuestionIndex === index && showAnswerInput;
              return (
                <button
                  type="button"
                  key={question.id}
                  onClick={() => selectQuestion(index)}
                  className={`w-full text-left p-3 rounded-lg border transition group ${
                    question.answered
                      ? 'bg-green-50 border-green-200 hover:border-green-300'
                      : active
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      question.answered ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-700 line-clamp-3 md:line-clamp-2">{question.text}</p>
                      {question.answered && (
                        <p className="mt-1 text-[11px] text-gray-500 bg-white/60 rounded px-2 py-1 line-clamp-1">
                          {question.answer}
                        </p>
                      )}
                    </div>
                    {question.answered && <span className="text-green-600 text-[10px] font-semibold">완료</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 답변/작성 패널 */}
        <div className="md:col-span-3 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
          {/* 제목 입력 */}
          {answeredCount > 0 && (
            <div className="px-4 pt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">일기 제목 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                placeholder="일기 제목을 입력하세요"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {!title.trim() && <p className="mt-1 text-[11px] text-red-500">제목을 입력해야 일기를 저장할 수 있습니다.</p>}
            </div>
          )}
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            {showAnswerInput ? (
              <div className="flex flex-col flex-1">
                <h3 className="font-semibold text-blue-800 mb-3 text-sm md:text-base">
                  질문 {currentQuestionIndex + 1}: {questions[currentQuestionIndex]?.text}
                </h3>
                <div className="flex-1 mb-4">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="이 질문에 대한 답변을 자유롭게 작성해보세요..."
                    maxLength={500}
                    className="w-full h-full min-h-[160px] rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="text-right text-[11px] text-gray-500 mt-1">{currentAnswer.length}/500자</div>
                </div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={cancelAnswer}
                    className={`${btn.base} ${btn.secondary} ${btn.md} flex-1`}
                  >
                    취소
                  </button>
                  <button
                    onClick={saveAnswer}
                    disabled={!currentAnswer.trim()}
                    className={`${btn.base} ${btn.primary} ${btn.md} flex-1`}
                  >
                    답변 저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">질문을 선택하여 답변을 작성하세요</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm">
                  왼쪽의 질문 목록에서 답변하고 싶은 항목을 클릭하면 이 영역에서 바로 작성할 수 있습니다. 작성한 답변은 자동으로 임시 저장되지 않으니 꼭 저장 버튼을 눌러주세요.
                </p>
                {answeredCount > 0 && (
                  <button
                    onClick={generateDiary}
                    disabled={!title.trim()}
                    className={`${btn.base} ${btn.success} ${btn.md}`}
                  >
                    {isAllAnswered ? '모든 답변으로 일기 완성' : '현재까지 답변으로 저장'}
                  </button>
                )}
              </div>
            )}
          </div>
          {/* 하단 액션바 (모바일 표시 우선) */}
          <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-500">{answeredCount}개 답변 완료</div>
            {answeredCount > 0 && (
              <button
                onClick={generateDiary}
                disabled={!title.trim()}
                className={`${btn.base} ${isAllAnswered ? btn.success : btn.primary} ${btn.sm}`}
              >
                {isAllAnswered ? '일기 완성하기' : '부분 저장'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
