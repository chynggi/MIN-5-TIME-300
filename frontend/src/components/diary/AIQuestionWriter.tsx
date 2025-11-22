"use client";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import type { DiarySelectedQuestion, DiaryQuestionDomain } from "@/types/diary";

interface Question {
  id: string; // 내부 UI 식별자
  domain: DiaryQuestionDomain;
  text: string;
  answered: boolean;
  answer: string;
  answerType: "text" | "emoji";
  emoji?: string;
}

interface AIQuestionWriterProps {
  onComplete: (data: { title: string; content: string; questionId: string; questionModel?: string; selectedQuestions: DiarySelectedQuestion[] }) => void;
  onBack: () => void;
  /**
   * 편집 모드: 기존에 저장된 질문들을 그대로 불러와 답변만 작성하도록 전달
   * 전달되면 질문 재생성(fetch/generate) 없이 이 배열을 사용
   */
  initialQuestions?: DiarySelectedQuestion[];
  initialTitle?: string;
  targetDate?: string; // 질문 생성 기준 날짜 (YYYY-MM-DD)
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

export default function AIQuestionWriter({ onComplete, onBack, initialQuestions, initialTitle = "", targetDate }: AIQuestionWriterProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answerType, setAnswerType] = useState<"text" | "emoji">("text");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const random = availableModels[Math.floor(Math.random() * availableModels.length)];
    return random.id;
  });
  // 실제 질문 생성에 사용된 모델을 저장해 요약 시에도 동일 모델을 사용
  const [generationModel, setGenerationModel] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  // 최초 1회 자동 생성 여부 (mount 당 메모리)
  const [autoGenAttempted, setAutoGenAttempted] = useState(false);
  // 질문 로드 여부 추적 (race condition 방지)
  const hasQuestionsLoaded = useRef(false);
  
  // 로딩 메시지 상태
  const [loadingMessage, setLoadingMessage] = useState("AI가 질문을 생성하고 있어요...");

  // 로딩 메시지 순환 효과
  useEffect(() => {
    if (isGenerating) {
      const messages = [
        "최근 일기를 분석하고 있어요...",
        "당신의 관심사를 확인하고 있어요...",
        "AI가 맞춤형 질문을 생성 중입니다...",
        "거의 다 되었습니다!"
      ];
      let step = 0;
      setLoadingMessage(messages[0]);
      
      const interval = setInterval(() => {
        step++;
        if (step < messages.length) {
          setLoadingMessage(messages[step]);
        }
      }, 1500); // 1.5초마다 메시지 변경
      
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // 초기 설정: 사용 가능한 모델 조회 (편집 모드라도 모델 목록은 UI용으로 조회)
  useEffect(() => {
    fetchAvailableModels();
  }, []);

  // props 변경 시 제목 동기화 (편집 모드 재진입)
  useEffect(() => {
    setTitle(initialTitle || "");
  }, [initialTitle]);

  // 초기 질문 준비: initialQuestions가 있으면 그것을 사용, 없으면 생성
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const mapped: Question[] = initialQuestions.map((q, idx) => {
        const savedAnswer = q.answer?.trim() ?? '';
        return {
          id: `saved-${idx}`,
          domain: q.domain,
          text: q.text,
          answered: savedAnswer.length > 0,
          answer: savedAnswer,
          answerType: 'text',
          emoji: ''
        };
      });
      setQuestions(mapped);
      hasQuestionsLoaded.current = true;
      setIsGenerating(false);
    } else if (enabledModels.length > 0 && !autoGenAttempted) {
      setAutoGenAttempted(true);
      generateQuestions();
    }
  }, [enabledModels, initialQuestions, autoGenAttempted]);

  // 마운트 즉시 한 번 더 시도(모델 목록 지연 시 폴백)
  useEffect(() => {
    if ((!initialQuestions || initialQuestions.length === 0) && !autoGenAttempted) {
      setAutoGenAttempted(true);
      generateQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const { enabledModels: enabled } = response.data;
      setEnabledModels(enabled);
      
      if (enabled && enabled.length > 0) {
        // 질문이 아직 로드되지 않았을 때만 랜덤 모델 설정 (생성된 질문의 모델이 덮어씌워지는 것 방지)
        if (!hasQuestionsLoaded.current) {
          const randomModel = enabled[Math.floor(Math.random() * enabled.length)];
          setSelectedModel(randomModel);
        }
      }
    } catch (error) {
      console.error("모델 정보 조회 실패:", error);
      // 폴백: 모든 모델 활성화 및 랜덤 선택
      const fallback = ["gemini-2.5-flash", "claude-sonnet-4", "gpt-5"];
      setEnabledModels(fallback);
      setSelectedModel(fallback[Math.floor(Math.random() * fallback.length)]);
    }
  };

  const generateQuestions = async (
    modelOverride?: string,
    options?: { force?: boolean },
  ) => {
    // 편집 모드에서는 생성 차단
    if (initialQuestions && initialQuestions.length > 0) return;
    setIsGenerating(true);
    try {
      const modelToUse = modelOverride || selectedModel;
      const params = new URLSearchParams();
      if (modelToUse) params.set("model", modelToUse);
      if (options?.force) params.set("force", "true");
      const query = params.toString();
      const res = await api.post(`/questions/generate${query ? `?${query}` : ""}`, {
        date: targetDate
      });
      // 기대 스키마: { questions: [ { domain, text }, ...5 ] }
      const data = res.data;
      if (data && data.ok === false) {
        // 서버 레이트리밋/오류 메시지 표준 처리
        const msg = data.message || '질문 생성이 제한되었습니다. 잠시 후 다시 시도해주세요.';
        console.warn('질문 생성 응답 실패:', msg);
        throw new Error(msg);
      }
      const list = Array.isArray(data.questions) ? data.questions : [];
      if (list.length !== 5) {
        console.warn('질문 개수 비정상:', list.length);
      }
      const mapped: Question[] = list.map((q: any, idx: number) => ({
        id: `q-${idx}`,
        domain: q.domain,
        text: q.text,
        answered: false,
        answer: '',
        answerType: 'text',
        emoji: ''
      }));
      // 도메인/텍스트 누락 대비 필터링
      const filtered = mapped.filter(m => m.text && m.domain);
      if (!filtered.length) {
        throw new Error('유효한 질문이 없습니다.');
      }
      setQuestions(filtered);
      hasQuestionsLoaded.current = true;
      
      // 실제 사용된 모델 저장 (백엔드 응답 우선, 없으면 요청 모델)
      const usedModel = typeof data?.model === 'string' && data.model ? data.model : modelToUse;
      setGenerationModel(usedModel);
      
      // UI 선택 모델도 실제 사용된 모델로 업데이트
      if (usedModel && availableModels.some(m => m.id === usedModel)) {
        setSelectedModel(usedModel);
      }
    } catch (error) {
      console.error('질문 생성 실패:', error);
      // 최소 폴백 (도메인 매핑된 기본 세트)
      const fallback: Question[] = [
        { id: 'q-0', domain: 'emotion', text: '지금 가장 선명한 감정은 무엇인가요?', answered: false, answer: '', answerType: 'text' },
        { id: 'q-1', domain: 'action', text: '오늘 의미 있었던 작은 행동 하나를 떠올려볼까요?', answered: false, answer: '', answerType: 'text' },
        { id: 'q-2', domain: 'relationship', text: '오늘 누구와의 상호작용이 마음에 남았나요?', answered: false, answer: '', answerType: 'text' },
        { id: 'q-3', domain: 'recovery', text: '오늘 나를 회복시키거나 쉬게 한 순간이 있었나요?', answered: false, answer: '', answerType: 'text' },
        { id: 'q-4', domain: 'goal', text: '내일 스스로에게 줄 아주 작은 약속은 무엇인가요?', answered: false, answer: '', answerType: 'text' }
      ];
      setQuestions(fallback);
    } finally {
      setIsGenerating(false);
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
    const trimmedAnswer = currentAnswer.trim();
    if (!trimmedAnswer) return;

    const updatedQuestions = questions.map((question, idx) =>
      idx === currentQuestionIndex
        ? { ...question, answered: true, answer: trimmedAnswer, answerType: "text" as const, emoji: "" }
        : question
    );
    setQuestions(updatedQuestions);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < updatedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer(updatedQuestions[nextIndex].answer || "");
      setShowAnswerInput(true);
    } else {
      setShowAnswerInput(false);
      setCurrentAnswer("");
    }
    setSelectedEmoji("");
    setAnswerType("text");
  };

  const cancelAnswer = () => {
    setShowAnswerInput(false);
    setCurrentAnswer("");
    setSelectedEmoji("");
    setAnswerType("text");
  };

  const generateDiary = async (mode: "final" | "draft") => {
    // 사용자가 아무 답변도 저장하지 않은 경우: 현재 선택된 질문을 기반으로 빈 답변 템플릿 생성
    const anyAnswered = questions.some(q => q.answered);
    let working = questions;
    if (!anyAnswered && typeof currentQuestionIndex === 'number' && questions[currentQuestionIndex]) {
      working = [questions[currentQuestionIndex]]; // 단일 질문 기반 작성
    } else if (!anyAnswered) {
      working = questions.slice(0,1); // 안전 폴백
    }
    console.log('[GenerateDiary] mode:', mode, 'questions:', working);
    let contentLines: string[] = [];
    let ids: string[] = [];
    working.forEach(q => {
      if (q.answered) {
        contentLines.push(`${q.text}\n${q.answer}`);
        ids.push(q.id);
      } else {
        // 미답변이면 질문만 포함해 초안 작성 유도
        contentLines.push(`${q.text}\n`);
        ids.push(q.id);
      }
    });

    let finalTitle = title.trim();
    if (!finalTitle) {
      // 첫 질문 텍스트 일부로 제목 제안
      finalTitle = working[0].text.slice(0, 18) + '...';
    }

    const finalizeRequested = mode === 'final';
    const allAnsweredNow = questions.length > 0 && questions.every(q => isAnswered(q.answer));
    if (finalizeRequested && !allAnsweredNow) {
      alert('모든 질문에 답변을 완료하면 일기 완성하기를 사용할 수 있어요.');
      return;
    }
    const shouldSummarize = finalizeRequested;
    console.log('[GenerateDiary] shouldSummarize:', shouldSummarize);
    const rawContent = contentLines.join('\n\n').trim();

    if (shouldSummarize) {
      try {
        setIsSummarizing(true);
        // 백엔드 요약 API 호출
        const res = await api.post(`/diaries/summarize`, {
          rawContent,
          title: finalTitle,
             modelId: generationModel && generationModel !== 'fallback' ? generationModel : selectedModel,
        });
        const summarized = res?.data?.text || rawContent;
        onComplete({
          title: finalTitle,
          content: summarized,
          questionId: ids.join(','),
             questionModel: generationModel && generationModel !== 'fallback' ? generationModel : selectedModel,
          selectedQuestions: working.map(q => ({ domain: q.domain, text: q.text, answer: q.answer })),
        });
      } catch (e) {
        console.error('요약 실패, 원문으로 대체합니다:', e);
        onComplete({
          title: finalTitle,
          content: rawContent,
          questionId: ids.join(','),
             questionModel: generationModel && generationModel !== 'fallback' ? generationModel : selectedModel,
          selectedQuestions: working.map(q => ({ domain: q.domain, text: q.text, answer: q.answer })),
        });
      } finally {
        setIsSummarizing(false);
      }
    } else {
      // 부분 저장: 즉시 원문 전달
      onComplete({
        title: finalTitle,
        content: rawContent,
        questionId: ids.join(','),
           questionModel: generationModel && generationModel !== 'fallback' ? generationModel : selectedModel,
        selectedQuestions: working.map(q => ({ domain: q.domain, text: q.text, answer: q.answer })),
      });
    }
  };

  const isAnswered = (value?: string) => (value?.trim().length ?? 0) > 0;
  const answeredCount = questions.filter(q => isAnswered(q.answer)).length;
  const totalCount = questions.length;
  const isAllAnswered = totalCount > 0 && answeredCount === totalCount;

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

  if (isGenerating || isSummarizing) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-full min-h-[500px]">
        {/* 비디오 재생 영역 */}
        <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-8 group">
          <video
            src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" // TODO: 실제 광고/추천 영상 URL로 교체 필요
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin backdrop-blur-sm"></div>
          </div>
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
            AD / 추천 영상
          </div>
        </div>

        {isGenerating ? (
          <>
            <h2 className="text-2xl font-bold mb-2 text-gray-800 animate-pulse">
              {loadingMessage}
            </h2>
            <p className="text-gray-500 mb-6 text-sm">
              잠시만 기다려주세요, 당신을 위한 특별한 질문을 만들고 있습니다.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">AI가 일기를 요약 중...</h2>
            <p className="text-gray-500 mb-6 text-sm">응답을 정리해 자연스러운 일기 형태로 다듬고 있어요.</p>
          </>
        )}
        
        <div className="w-full max-w-md space-y-2">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
            <div className="w-full h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 animate-[progress_2s_ease-in-out_infinite] origin-left" />
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>AI 분석 중...</span>
            <span>신뢰도 90% 이상</span>
          </div>
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
                      onClick={() => { 
                        setSelectedModel(model.id); 
                        setShowModelSelector(false); 
                      }}
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
          {!initialQuestions?.length && (
            <button
              onClick={() => generateQuestions(undefined, { force: true })}
              disabled={isGenerating}
              className={`${btn.base} ${btn.secondary} ${btn.sm}`}
            >
              🔄 재생성
            </button>
          )}
          <div className="flex-1 min-w-[160px] hidden md:flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="text-xs font-medium text-gray-600 whitespace-nowrap">{answeredCount}/{totalCount}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isAllAnswered && (
              <button
                onClick={() => generateDiary('final')}
                disabled={!title.trim()}
                className={`${btn.base} ${btn.primary} ${btn.sm} hidden md:inline-flex`}
              >
                일기 완성하기
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
              {initialQuestions?.length ? ' (편집 모드: 요약 시 사용됩니다)' : ''}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          일기 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          placeholder="일기 제목을 입력하세요"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isAllAnswered && !title.trim() && (
          <p className="mt-1 text-[11px] text-red-500">제목을 입력해야 일기를 저장할 수 있습니다.</p>
        )}
      </div>

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
              const completed = isAnswered(question.answer);
              return (
                <button
                  type="button"
                  key={question.id}
                  onClick={() => selectQuestion(index)}
                  className={`w-full text-left p-3 rounded-lg border transition group ${
                    completed
                      ? 'bg-green-50 border-green-200 hover:border-green-300'
                      : active
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold tracking-wide uppercase">{question.domain}</span>
                      </div>
                      <p className="text-xs md:text-sm font-medium text-gray-700 line-clamp-3 md:line-clamp-2">{question.text}</p>
                      {completed && (
                        <p className="mt-1 text-[11px] text-gray-500 bg-white/60 rounded px-2 py-1 line-clamp-1">
                          {question.answer}
                        </p>
                      )}
                    </div>
                    {completed && <span className="text-green-600 text-[10px] font-semibold">완료</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 답변/작성 패널 */}
        <div className="md:col-span-3 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
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
                {isAllAnswered && (
                  <button
                    onClick={() => generateDiary('final')}
                    disabled={!title.trim()}
                    className={`${btn.base} ${btn.success} ${btn.md}`}
                  >
                    모든 답변으로 일기 완성
                  </button>
                )}
              </div>
            )}
          </div>
          {/* 하단 액션바 (모바일 표시 우선) */}
          <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-500">{answeredCount}개 답변 완료</div>
            {isAllAnswered && (
              <button
                onClick={() => generateDiary('final')}
                disabled={!title.trim()}
                className={`${btn.base} ${btn.success} ${btn.sm}`}
              >
                일기 완성하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


