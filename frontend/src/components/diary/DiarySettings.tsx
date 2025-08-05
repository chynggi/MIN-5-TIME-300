"use client";
import { useState } from "react";

interface DiarySettingsProps {
  settings: {
    postVisibility: "private" | "public" | "friends";
    contentVisibility: "public" | "private";
    weather: "sunny" | "cloudy" | "rainy" | "snowy";
  };
  onSettingsChange: (settings: any) => void;
}

export default function DiarySettings({ settings, onSettingsChange }: DiarySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePostVisibilityChange = (visibility: "private" | "public" | "friends") => {
    const newSettings = {
      ...settings,
      postVisibility: visibility,
      // 게시물이 비공개일 때 일기 공개/비공개 선택 불가
      contentVisibility: visibility === "private" ? "private" : settings.contentVisibility
    };
    onSettingsChange(newSettings);
  };

  const handleContentVisibilityChange = (visibility: "public" | "private") => {
    onSettingsChange({
      ...settings,
      contentVisibility: visibility
    });
  };

  const handleWeatherChange = (weather: "sunny" | "cloudy" | "rainy" | "snowy") => {
    onSettingsChange({
      ...settings,
      weather
    });
  };

  const getWeatherEmoji = (weather: string) => {
    switch (weather) {
      case "sunny": return "☀️";
      case "cloudy": return "☁️";
      case "rainy": return "🌧️";
      case "snowy": return "❄️";
      default: return "☀️";
    }
  };

  const getWeatherLabel = (weather: string) => {
    switch (weather) {
      case "sunny": return "맑음";
      case "cloudy": return "흐림";
      case "rainy": return "비";
      case "snowy": return "눈";
      default: return "맑음";
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">일기 추가 설정</h3>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs text-blue-600 underline"
        >
          {isOpen ? "설정 닫기" : "설정 열기"}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* 게시물 공개 범위 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">게시물 공개 범위</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePostVisibilityChange("private")}
                className={`p-2 rounded-lg border text-center text-xs ${
                  settings.postVisibility === "private"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-lg mb-1">🔒</div>
                <div className="font-semibold">비공개</div>
                <div className="text-xs opacity-70">본인만 열람</div>
              </button>
              <button
                type="button"
                onClick={() => handlePostVisibilityChange("public")}
                className={`p-2 rounded-lg border text-center text-xs ${
                  settings.postVisibility === "public"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-lg mb-1">🌍</div>
                <div className="font-semibold">전체공개</div>
                <div className="text-xs opacity-70">커뮤니티 표시</div>
              </button>
              <button
                type="button"
                onClick={() => handlePostVisibilityChange("friends")}
                className={`p-2 rounded-lg border text-center text-xs ${
                  settings.postVisibility === "friends"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-lg mb-1">👥</div>
                <div className="font-semibold">친구공개</div>
                <div className="text-xs opacity-70">팔로워만 열람</div>
              </button>
            </div>
          </div>

          {/* 일기 공개 범위 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">일기 내용 공개 범위</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleContentVisibilityChange("public")}
                disabled={settings.postVisibility === "private"}
                className={`p-2 rounded-lg border text-center text-xs ${
                  settings.postVisibility === "private"
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : settings.contentVisibility === "public"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-lg mb-1">📖</div>
                <div className="font-semibold">공개</div>
                <div className="text-xs opacity-70">일기 내용 공개</div>
              </button>
              <button
                type="button"
                onClick={() => handleContentVisibilityChange("private")}
                disabled={settings.postVisibility === "private"}
                className={`p-2 rounded-lg border text-center text-xs ${
                  settings.postVisibility === "private"
                    ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : settings.contentVisibility === "private"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="text-lg mb-1">🔏</div>
                <div className="font-semibold">비공개</div>
                <div className="text-xs opacity-70">내용 모자이크</div>
              </button>
            </div>
            {settings.postVisibility === "private" && (
              <p className="text-xs text-gray-500 mt-1">
                게시물이 비공개일 때는 일기 내용 공개 설정을 변경할 수 없습니다.
              </p>
            )}
          </div>

          {/* 날씨 설정 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">오늘의 날씨 *</h4>
            <div className="grid grid-cols-4 gap-2">
              {["sunny", "cloudy", "rainy", "snowy"].map((weather) => (
                <button
                  key={weather}
                  type="button"
                  onClick={() => handleWeatherChange(weather as any)}
                  className={`p-2 rounded-lg border text-center text-xs ${
                    settings.weather === weather
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-lg mb-1">{getWeatherEmoji(weather)}</div>
                  <div className="font-semibold">{getWeatherLabel(weather)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 현재 설정 요약 */}
      <div className="mt-3 p-2 bg-white rounded border text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">현재 설정:</span>
          <div className="flex items-center gap-2">
            <span className="bg-gray-100 px-2 py-1 rounded">
              {settings.postVisibility === "private" ? "🔒 비공개" : 
               settings.postVisibility === "public" ? "🌍 전체공개" : "👥 친구공개"}
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              {getWeatherEmoji(settings.weather)} {getWeatherLabel(settings.weather)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
