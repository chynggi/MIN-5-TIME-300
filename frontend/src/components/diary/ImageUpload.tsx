"use client";
import { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onImageSelect: (file: File | null) => void;
  preview: string | null;
}

const defaultImages = {
  spring: "/images/seasons/spring.jpg",
  summer: "/images/seasons/summer.jpg",
  autumn: "/images/seasons/autumn.jpg",
  winter: "/images/seasons/winter.jpg",
  sunny: "/images/weather/sunny.jpg",
  night: "/images/weather/night.jpg",
  rain: "/images/weather/rain.jpg",
  snow: "/images/weather/snow.jpg",
};

export default function ImageUpload({ onImageSelect, preview }: ImageUploadProps) {
  const [selectedDefault, setSelectedDefault] = useState<string | null>(null);
  const [showDefaultImages, setShowDefaultImages] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
      setSelectedDefault(null);
    }
  };

  const handleDefaultSelect = (imageKey: string) => {
    setSelectedDefault(imageKey);
    onImageSelect(null); // 기본 이미지 선택 시 파일은 null
  };

  const handleRemoveImage = () => {
    onImageSelect(null);
    setSelectedDefault(null);
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">이미지 추가</h3>
        <button
          type="button"
          onClick={() => setShowDefaultImages(!showDefaultImages)}
          className="text-xs text-blue-600 underline"
        >
          기본 이미지 {showDefaultImages ? "숨기기" : "보기"}
        </button>
      </div>

      {/* 이미지 미리보기 영역 */}
      <div className="relative w-full h-40 bg-gray-200 rounded-lg mb-3 overflow-hidden">
        {preview ? (
          <Image src={preview} alt="미리보기" fill className="object-cover" />
        ) : selectedDefault ? (
          <Image src={defaultImages[selectedDefault as keyof typeof defaultImages]} alt="기본 이미지" fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📷</div>
              <div className="text-sm">이미지를 선택해주세요</div>
            </div>
          </div>
        )}
        {(preview || selectedDefault) && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 파일 업로드 버튼 */}
      <div className="mb-3">
        <label className="bg-gray-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors text-sm">
          사진 업로드
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* 기본 이미지 선택 */}
      {showDefaultImages && (
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(defaultImages).map(([key, src]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleDefaultSelect(key)}
              className={`relative h-20 rounded-lg overflow-hidden border-2 ${
                selectedDefault === key ? "border-blue-500" : "border-gray-300"
              }`}
            >
              <Image src={src} alt={key} fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                {key === "spring" && "봄"}
                {key === "summer" && "여름"}
                {key === "autumn" && "가을"}
                {key === "winter" && "겨울"}
                {key === "sunny" && "햇살"}
                {key === "night" && "밤"}
                {key === "rain" && "비"}
                {key === "snow" && "눈"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
