"use client";
import { useState } from "react";

interface AIQuestionWriterProps {
  onComplete: (data: { title: string; content: string; questionId: string }) => void;
  onBack: () => void;
}

export default function AIQuestionWriter({ onComplete, onBack }: AIQuestionWriterProps) {
  const [currentStep, setCurrentStep] = useState<"question" | "writing" | "summary">("question");
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateQuestions = async () => {
    setIsGenerating(true);
    try {
      // TODO: 실제 API 호출
      // const response = await api.post("/questions/generate-multiple");
      // setQuestions(response.data.questions);
      
      // 임시 데이터 - 5가지 질문 제공
      const questionList = [
        "오늘 가장 기억에 남는 순간은 무엇이었나요?",
        "오늘 하루 중 가장 감사했던 일은 무엇인가요?",
        "오늘 새롭게 배운 것이나 깨달은 점이 있다면?",
        "오늘 만난 사람들 중 특별히 기억에 남는 사람이 있나요?",
        "오늘의 날씨가 당신의 기분에 어떤 영향을 주었나요?"
      ];
      
      setTimeout(() => {
        setQuestions(questionList);
        setIsGenerating(false);
      }, 2000);
    } catch (error) {
      console.error("질문 생성 실패:", error);
      setIsGenerating(false);
    }
  };

  const selectQuestion = (question: string, index: number) => {
    setSelectedQuestion(question);
    setQuestionId("temp-" + index);
    setCurrentStep("writing");
  };

  const analyzeAndSummarize = async () => {
    if (!content.trim()) {
      alert("일기 내용을 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-diary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          question: selectedQuestion,
          emotion: '😊' // 실제로는 부모 컴포넌트에서 전달받아야 함
        }),
      });

      if (!response.ok) {
        throw new Error('분석 실패');
      }

      const data = await response.json();
      setAiSummary(data.summary);
      setCurrentStep("summary");
    } catch (error) {
      console.error("일기 분석 실패:", error);
      // 실패시 임시 응답 사용
      setAiSummary(`📝 선택한 질문: ${selectedQuestion}

📖 주요 내용: ${content.slice(0, 50)}...에 대한 생각과 경험을 기록하셨습니다.

😊 감정 분석: 전반적으로 긍정적인 하루를 보내신 것 같습니다.

🎯 핵심 키워드: 일상, 경험, 성찰

💡 AI 조언: 선택하신 질문에 대해 깊이 있게 생각하고 기록해주셨네요. 이런 기록들이 모여 소중한 추억이 될 것입니다.`);
      setCurrentStep("summary");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplete = () => {
    onComplete({ title, content, questionId });
  };

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === "question" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
          }`}>
            1
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === "question" ? "bg-gray-300 text-gray-600" :
            currentStep === "writing" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
          }`}>
            2
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentStep === "summary" ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Step 1: 질문 생성 및 선택 */}
      {currentStep === "question" && (
        <div className="text-center space-y-4">
          <div className="bg-gray-100 rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">GPT 질문 제공</h2>
            {questions.length === 0 ? (
              <div>
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-gray-600 mb-4">AI가 오늘의 특별한 질문들을 준비하고 있습니다.</p>
                <button
                  onClick={generateQuestions}
                  disabled={isGenerating}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isGenerating ? "질문 생성 중..." : "질문 생성하기"}
                </button>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">💭</div>
                <p className="text-gray-600 mb-4">마음에 드는 질문을 선택해주세요</p>
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => selectQuestion(question, index)}
                      className="w-full bg-white rounded-lg p-4 text-left hover:bg-blue-50 hover:border-blue-300 border border-gray-200 transition-colors"
                    >
                      <div className="flex items-start">
                        <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-gray-700 font-medium">{question}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={generateQuestions}
                  className="mt-4 text-sm text-blue-600 underline hover:text-blue-700"
                >
                  다른 질문 생성하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: 일기 작성 */}
      {currentStep === "writing" && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">선택한 질문</h3>
            <p className="text-blue-700 font-medium">{selectedQuestion}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">일기 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력해주세요"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">질문에 대한 답변</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="질문에 대한 생각과 오늘의 이야기를 자유롭게 적어보세요..."
              className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-none"
              maxLength={1000}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {content.length}/1000자
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              뒤로가기
            </button>
            <button
              onClick={analyzeAndSummarize}
              disabled={isAnalyzing || !content.trim()}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isAnalyzing ? "분석 중..." : "작성 완료"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI 요약 */}
      {currentStep === "summary" && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">GPT 요약본 생성 화면</h2>
            <div className="bg-white rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{aiSummary}</pre>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep("writing")}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              수정하기
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              일기 저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
