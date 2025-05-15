"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function QuestionsPage() {
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);

  const handleAddQuestion = () => {
    if (question.trim()) {
      setQuestions((prev) => [...prev, question]);
      setQuestion("");
    }
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <h1 className="text-2xl md:text-4xl font-bold mb-6">질문 페이지</h1>

      <Card>
        <CardHeader>
          <CardTitle>질문 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="질문을 입력하세요"
              className="flex-1"
            />
            <Button onClick={handleAddQuestion} className="bg-blue-500 text-white">
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">질문 목록</h2>
        <ul className="space-y-2">
          {questions.map((q, index) => (
            <li key={index} className="p-4 border rounded shadow">
              {q}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}