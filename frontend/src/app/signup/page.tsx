"use client";
import React, { useState } from "react";
import { useApi } from "@/lib/useApi";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  // 관심사 카테고리 및 항목 프리셋
  const INTEREST_CATEGORIES = [
    {
      name: "음악",
      items: [
        "음악 감상", "공연 관람", "작곡/편곡", "밴드/합주", "악기 연주", "보컬/노래", "음반/LP 수집", "음악 리뷰", "음악 이론 공부", "음악 수업"
      ],
    },
    {
      name: "영화/영상",
      items: [
        "영화 감상", "로맨스 영화 감상", "스릴러/호러 감상", "코미디/드라마 감상", "다큐멘터리 감상", "애니메이션 감상", "단편영화 감상", "영화 리뷰", "영화 제작", "OTT 신작 탐색"
      ],
    },
    {
      name: "예술/디자인",
      items: [
        "미술관 관람", "전시회 탐방", "일러스트 그리기", "사진 촬영", "AR/VR 아트 감상", "공예/핸드메이드", "디자인 트렌드 탐색", "포트폴리오 제작", "아트 클래스 참여", "예술 독서"
      ],
    },
    {
      name: "게임",
      items: [
        "콘솔 게임 즐기기", "PC 게임 즐기기", "모바일 게임 즐기기", "보드게임 즐기기", "RPG 게임 플레이", "FPS 게임 플레이", "시뮬레이션 게임", "게임 리뷰", "게임 스트리밍", "게임 대회 참가"
      ],
    },
    {
      name: "독서/글쓰기",
      items: [
        "소설 읽기", "에세이 읽기", "시/시집 읽기", "자기계발서 읽기", "잡지/웹툰 읽기", "독서 모임 참여", "감상문/서평 쓰기", "일기 쓰기", "창작 소설 쓰기", "블로그/에세이 쓰기"
      ],
    },
    {
      name: "운동/스포츠",
      items: [
        "헬스/웨이트 트레이닝", "러닝(조깅)", "등산/트레킹", "수영", "요가/필라테스", "자전거 타기", "구기종목(축구/농구 등)", "라켓스포츠(테니스/배드민턴 등)", "댄스/에어로빅", "겨울스포츠(스키/보드)"
      ],
    },
  ];

  // 라이프스타일 카테고리 및 항목 프리셋
  const LIFESTYLE_CATEGORIES = [
    {
      name: "인간관계 스타일",
      items: [
        "사람을 자주 만나는 편이다", "친한 사람과 자주 논다", "혼자 있는 시간을 좋아한다", "스킨십/동행을 좋아한다", "다양한 모임에 참여한다", "연락을 자주 하는 편이다", "친구와의 약속을 잘 지킨다", "새로운 사람 만나는 걸 두려워하지 않는다", "혼자만의 시간이 필요하다", "오래된 인연을 소중히 여긴다"
      ],
    },
    {
      name: "소비/금전 습관",
      items: [
        "소비를 아끼는 편이다", "작은 것에 감사한다", "충동구매를 잘 안 한다", "물건을 오래 쓴다", "중고거래를 한다", "할인/이벤트를 챙긴다", "가성비를 중요시한다", "브랜드/트렌드를 신경 쓴다", "계획적으로 소비한다", "후불 소비습관을 받지 않는다"
      ],
    },
    {
      name: "생활 리듬",
      items: [
        "아침형 인간이다", "저녁형 인간이다", "계획적으로 생활한다", "즉흥적으로 생활한다", "주말은 꼭 쉬는 편이다", "운동을 자주 한다", "야외 활동을 즐긴다", "집에 있는 걸 좋아한다", "취미가 많다", "여행을 자주 간다"
      ],
    },
    {
      name: "자기계발/성장욕구",
      items: [
        "목표를 세우고 꾸준히 관리한다", "독서를 자주 한다", "자격증/학습에 관심이 많다", "취미를 확장하는 편이다", "새로운 도전을 즐긴다", "스스로 동기부여를 잘 한다", "스터디/모임에 참여한다", "멘토/롤모델이 있다", "자기계발 강의를 듣는다", "성장한 경험을 남기고 싶다"
      ],
    },
  ];

  const PROFILE_COLORS = [
    "#f87171", "#fbbf24", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#f9a8d4", "#fcd34d", "#bef264", "#5eead4", "#60a5fa", "#a3e635"
  ];

  // 회원가입 내부 페이지 단계
  const [step, setStep] = useState(0);
  const steps = ["기본정보", "MBTI", "관심사", "라이프스타일", "프로필 컬러"];
  // 관심사/라이프스타일 카테고리 인덱스
  const [interestCategoryIndex, setInterestCategoryIndex] = useState(0);
  const [lifestyleCategoryIndex, setLifestyleCategoryIndex] = useState(0);
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    username: "",
    birth: "",
    height: "",
    weight: "",
    job: "",
    education: "",
    mbti: "",
    interests: [] as { category: string; item: string }[],
    lifestyle: [] as { category: string; item: string }[],
    profileColor: PROFILE_COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 관심사 카테고리-항목 선택
  const toggleInterest = (category: string, item: string) => {
    const exists = form.interests.find((i) => i.category === category && i.item === item);
    if (exists) {
      setForm({
        ...form,
        interests: form.interests.filter((i) => !(i.category === category && i.item === item)),
      });
    } else {
      setForm({
        ...form,
        interests: [...form.interests, { category, item }],
      });
    }
  };

  // 라이프스타일 카테고리-항목 선택
  const toggleLifestyle = (category: string, item: string) => {
    const exists = form.lifestyle.find((i) => i.category === category && i.item === item);
    if (exists) {
      setForm({
        ...form,
        lifestyle: form.lifestyle.filter((i) => !(i.category === category && i.item === item)),
      });
    } else {
      setForm({
        ...form,
        lifestyle: [...form.lifestyle, { category, item }],
      });
    }
  };

  const signupApi = useApi("post", "/signup");
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      // 관심사 priority 자동 부여 (카테고리-항목)
      const interests = form.interests.map((interest, i) => ({
        interest: `${interest.category} - ${interest.item}`,
        priority: i + 1,
      }));
      // 라이프스타일 카테고리-항목
      const lifestyle = form.lifestyle.map((life, i) => ({
        question: `${life.category} - ${life.item}`,
        answer: "선택",
      }));
      const payload = {
        email: form.email,
        password: form.password,
        username: form.username,
        mbti: form.mbti,
        interests,
        lifestyle,
      };
      const data = await signupApi.request(payload);
      if (data && data.token) {
        localStorage.setItem("token", data.token);
      }
      setSuccess(true);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-5xl bg-white/90 rounded-2xl shadow-2xl flex flex-col md:flex-row p-0 md:p-4 gap-0 md:gap-4">
        {/* 좌측 안내/이미지/스텝 영역 (데스크탑에서만 노출) */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-50 rounded-l-2xl p-4">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-6">회원가입</h2>
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="flex gap-2 mb-2">
              {steps.map((label, idx) => (
                <div key={label} className={`w-3 h-3 rounded-full ${step === idx ? "bg-blue-600" : "bg-gray-300"}`}></div>
              ))}
            </div>
            <div className="text-lg font-semibold text-blue-800 mb-2">{steps[step]}</div>
            {/* 단계별 안내/이미지/설명 */}
            <div className="text-gray-600 text-center text-base min-h-[60px] flex items-center justify-center">
              {step === 0 && "기본 정보를 입력해 주세요."}
              {step === 1 && "나의 MBTI를 선택해 주세요."}
              {step === 2 && "관심사를 카테고리별로 선택해 주세요."}
              {step === 3 && "라이프스타일을 선택해 주세요."}
              {step === 4 && "프로필 컬러를 선택해 주세요."}
            </div>
            {/* 예시 이미지/일러스트 영역 (원한다면 추가) */}
            {/* <img src="/signup-illustration.svg" alt="회원가입 안내" className="w-40 h-40 object-contain" /> */}
          </div>
        </div>
        {/* 우측 폼 영역 */}
        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 p-4 flex flex-col gap-4 md:gap-6 justify-center"
        >
          {/* 모바일에서만 노출되는 상단 타이틀/스텝 */}
          <div className="md:hidden flex flex-col items-center mb-2">
            <h2 className="text-2xl font-bold text-blue-700 mb-2">회원가입</h2>
            <div className="flex gap-2 mb-2">
              {steps.map((label, idx) => (
                <div key={label} className={`w-2 h-2 rounded-full ${step === idx ? "bg-blue-600" : "bg-gray-300"}`}></div>
              ))}
            </div>
            <div className="text-base font-semibold text-blue-800 mb-2">{steps[step]}</div>
          </div>
          {/* 단계별 폼 */}
          {step === 0 && (
            <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-6 mb-2">
              <input
                type="email"
                name="email"
                placeholder="이메일"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input
                type="text"
                name="username"
                placeholder="닉네임"
                value={form.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <input
                type="date"
                name="birth"
                placeholder="생년월일"
                value={form.birth}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  name="height"
                  placeholder="신장(cm)"
                  value={form.height}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <input
                  type="text"
                  name="weight"
                  placeholder="몸무게(kg)"
                  value={form.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <select
                name="job"
                value={form.job}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">직업 선택</option>
                <option value="학생">학생</option>
                <option value="회사원">회사원</option>
                <option value="프리랜서">프리랜서</option>
                <option value="공무원">공무원</option>
                <option value="자영업">자영업</option>
                <option value="전문직">전문직(의사/변호사 등)</option>
                <option value="교사/강사">교사/강사</option>
                <option value="연구원">연구원</option>
                <option value="무직">무직</option>
                <option value="기타">기타</option>
              </select>
              <select
                name="education"
                value={form.education}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">학력 선택</option>
                <option value="고등학교 졸업">고등학교 졸업</option>
                <option value="전문대 졸업">전문대 졸업</option>
                <option value="대학교 재학">대학교 재학</option>
                <option value="대학교 졸업">대학교 졸업</option>
                <option value="대학원 재학">대학원 재학</option>
                <option value="대학원 졸업">대학원 졸업</option>
                <option value="박사과정">박사과정</option>
                <option value="기타">기타</option>
              </select>
            </div>
          )}
          {step === 1 && (
            <div className="flex flex-col items-center md:items-center w-full">
              <label className="block font-semibold mb-1 text-gray-700">MBTI</label>
              <div className="flex flex-col gap-4 w-full max-w-md mb-2">
                {/* E/I */}
                <div className="flex flex-row items-center gap-4 w-full">
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">E</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[0] === 'E' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[0] = 'E';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >E</button>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">I</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[0] === 'I' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[0] = 'I';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >I</button>
                  </div>
                </div>
                {/* N/S */}
                <div className="flex flex-row items-center gap-4 w-full">
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">N</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[1] === 'N' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[1] = 'N';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >N</button>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">S</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[1] === 'S' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[1] = 'S';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >S</button>
                  </div>
                </div>
                {/* F/T */}
                <div className="flex flex-row items-center gap-4 w-full">
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">F</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[2] === 'F' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[2] = 'F';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >F</button>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">T</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[2] === 'T' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[2] = 'T';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >T</button>
                  </div>
                </div>
                {/* P/J */}
                <div className="flex flex-row items-center gap-4 w-full">
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">P</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[3] === 'P' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[3] = 'P';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >P</button>
                  </div>
                  <div className="flex flex-col items-center flex-1 gap-1">
                    <span className="font-bold text-blue-700 text-base">J</span>
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full font-bold text-lg border-2 transition ${form.mbti[3] === 'J' ? 'bg-blue-500 text-white border-blue-700 scale-105' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'}`}
                      onClick={() => {
                        let mbtiArr = form.mbti.padEnd(4, ' ').split('');
                        mbtiArr[3] = 'J';
                        setForm({ ...form, mbti: mbtiArr.join('').trim() });
                      }}
                    >J</button>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">선택: <span className="font-semibold">{form.mbti}</span></div>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-6 items-center">
              {/* 카테고리 네비게이션 */}
              <div className="flex items-center gap-4 mb-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                  onClick={() => setInterestCategoryIndex((idx) => Math.max(0, idx - 1))}
                  disabled={interestCategoryIndex === 0}
                >
                  이전 카테고리
                </button>
                <span className="font-bold text-blue-700 text-lg">
                  {INTEREST_CATEGORIES[interestCategoryIndex].name}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                  onClick={() => setInterestCategoryIndex((idx) => Math.min(INTEREST_CATEGORIES.length - 1, idx + 1))}
                  disabled={interestCategoryIndex === INTEREST_CATEGORIES.length - 1}
                >
                  다음 카테고리
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 flex flex-col items-center w-full max-w-lg">
                <div className="font-bold text-blue-700 mb-2">{INTEREST_CATEGORIES[interestCategoryIndex].name}</div>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {INTEREST_CATEGORIES[interestCategoryIndex].items.map((item) => {
                    const selected = form.interests.some((i) => i.category === INTEREST_CATEGORIES[interestCategoryIndex].name && i.item === item);
                    return (
                      <button
                        type="button"
                        key={item}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition ${selected ? "bg-blue-500 text-white border-blue-700" : "bg-white text-blue-700 border-blue-200 hover:bg-blue-100"}`}
                        onClick={() => toggleInterest(INTEREST_CATEGORIES[interestCategoryIndex].name, item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">선택된 관심사: {form.interests.length}개</div>
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-6 items-center">
              {/* 라이프스타일 카테고리 네비게이션 */}
              <div className="flex items-center gap-4 mb-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                  onClick={() => setLifestyleCategoryIndex((idx) => Math.max(0, idx - 1))}
                  disabled={lifestyleCategoryIndex === 0}
                >
                  이전 카테고리
                </button>
                <span className="font-bold text-orange-700 text-lg">
                  {LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold disabled:opacity-50"
                  onClick={() => setLifestyleCategoryIndex((idx) => Math.min(LIFESTYLE_CATEGORIES.length - 1, idx + 1))}
                  disabled={lifestyleCategoryIndex === LIFESTYLE_CATEGORIES.length - 1}
                >
                  다음 카테고리
                </button>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 flex flex-col items-center w-full max-w-lg">
                <div className="font-bold text-orange-700 mb-2">{LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name}</div>
                <div className="grid grid-cols-1 gap-2 w-full">
                  {LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].items.map((item) => {
                    const selected = form.lifestyle.some((i) => i.category === LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name && i.item === item);
                    return (
                      <button
                        type="button"
                        key={item}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border transition ${selected ? "bg-orange-500 text-white border-orange-700" : "bg-white text-orange-700 border-orange-200 hover:bg-orange-100"}`}
                        onClick={() => toggleLifestyle(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name, item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">선택된 라이프스타일: {form.lifestyle.length}개</div>
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col items-center md:items-start w-full max-w-lg mx-auto">
              <label className="block font-semibold mb-1 text-gray-700">프로필 컬러</label>
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition ${form.profileColor === color ? "border-black scale-110" : "border-gray-200"}`}
                    style={{ background: color }}
                    onClick={() => setForm({ ...form, profileColor: color })}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 text-center mb-4">선택: <span style={{ color: form.profileColor }}>{form.profileColor}</span></div>
            </div>
          )}
          {/* 하단 버튼/상태 */}
          <div className="flex gap-2 mt-4 md:mt-8">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold text-lg shadow hover:bg-gray-300 transition">이전</button>
            )}
            {step < steps.length - 1 && (
              <button type="button" onClick={() => setStep(step + 1)} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition">다음</button>
            )}
            {step === steps.length - 1 && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? "가입 중..." : "회원가입"}
              </button>
            )}
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">회원가입이 완료되었습니다! 로그인 해주세요.</div>}
          <div className="text-center text-sm mt-2">
            이미 계정이 있으신가요? <a href="/login" className="text-blue-600 hover:underline">로그인</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
