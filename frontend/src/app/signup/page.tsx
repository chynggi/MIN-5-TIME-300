"use client";
import React, { useState } from "react";
import { useApi } from "@/lib/useApi";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  // 카테고리별 아이콘 매핑
  const CATEGORY_ICONS = {
    "음악": "🎵",
    "영화/영상": "🎬", 
    "예술/디자인": "🎨",
    "게임": "🎮",
    "독서/글쓰기": "📚",
    "운동/스포츠": "⚽",
    "요리/음식": "🍳",
    "패션/쇼핑": "👗",
    "여행/자연": "🌍",
    "웰니스/힐링": "🧘",
    "반려동물": "🐕",
    "개발/테크": "💻",
    "심리/철학": "🧠",
    "사회/가치관": "🤝",
    "공부/학습": "📖",
    "커리어/자기계발": "📈",
    "자동차/모빌리티": "🚗",
    "뷰티/미용": "💄"
  };

  // 관심사 카테고리 및 항목 프리셋
  const INTEREST_CATEGORIES = [
    {
      name: "음악",
      items: [
        "음악 감상", "공연 관람", "작곡/편곡", "밴드/합주", "악기 연주", "보컬/노래", "음반/LP 수집", "음악 리뷰", "음악 이론 공부", "음악 수업",
        "클래식 음악", "재즈", "록/메탈", "힙합/랩", "팝송", "K-POP", "인디음악", "국악", "EDM", "뮤지컬"
      ],
    },
    {
      name: "영화/영상",
      items: [
        "영화 감상", "로맨스 영화 감상", "스릴러/호러 감상", "코미디/드라마 감상", "다큐멘터리 감상", "애니메이션 감상", "단편영화 감상", "영화 리뷰", "영화 제작", "OTT 신작 탐색",
        "독립영화", "외국영화", "한국영화", "웹드라마", "예능 프로그램", "유튜브", "틱톡", "영상 편집", "촬영", "시나리오 작성"
      ],
    },
    {
      name: "예술/디자인",
      items: [
        "미술관 관람", "전시회 탐방", "일러스트 그리기", "사진 촬영", "AR/VR 아트 감상", "공예/핸드메이드", "디자인 트렌드 탐색", "포트폴리오 제작", "아트 클래스 참여", "예술 독서",
        "회화", "조각", "도예", "서예", "캘리그라피", "그래픽 디자인", "UI/UX 디자인", "패션 디자인", "인테리어 디자인", "건축"
      ],
    },
    {
      name: "게임",
      items: [
        "콘솔 게임 즐기기", "PC 게임 즐기기", "모바일 게임 즐기기", "보드게임 즐기기", "RPG 게임 플레이", "FPS 게임 플레이", "시뮬레이션 게임", "게임 리뷰", "게임 스트리밍", "게임 대회 참가",
        "MMORPG", "RTS", "퍼즐 게임", "리듬 게임", "카드 게임", "MOBA", "배틀로얄", "인디 게임", "레트로 게임", "VR 게임"
      ],
    },
    {
      name: "독서/글쓰기",
      items: [
        "소설 읽기", "에세이 읽기", "시/시집 읽기", "자기계발서 읽기", "잡지/웹툰 읽기", "독서 모임 참여", "감상문/서평 쓰기", "일기 쓰기", "창작 소설 쓰기", "블로그/에세이 쓰기",
        "역사서", "철학서", "과학서", "경제/경영서", "심리학서", "만화/웹툰", "시나리오", "수필", "기행문", "비평"
      ],
    },
    {
      name: "운동/스포츠",
      items: [
        "헬스/웨이트 트레이닝", "러닝(조깅)", "등산/트레킹", "수영", "요가/필라테스", "자전거 타기", "구기종목(축구/농구 등)", "라켓스포츠(테니스/배드민턴 등)", "댄스/에어로빅", "겨울스포츠(스키/보드)",
        "마라톤", "크로스핏", "클라이밍", "서핑", "스케이트보드", "골프", "볼링", "탁구", "복싱", "태권도", "검도", "유도", "체조", "승마"
      ],
    },
    {
      name: "요리/음식",
      items: [
        "요리하기", "베이킹", "커피 내리기", "와인 테이스팅", "맛집 탐방", "레시피 개발", "식재료 연구", "영양학", "다이어트 식단", "건강식 만들기",
        "한식 요리", "양식 요리", "중식 요리", "일식 요리", "동남아 요리", "디저트 만들기", "칵테일 만들기", "차(茶) 문화", "발효음식", "비건 요리"
      ],
    },
    {
      name: "패션/쇼핑",
      items: [
        "패션 트렌드", "스타일링", "옷 쇼핑", "액세서리", "신발 컬렉션", "빈티지 패션", "명품 브랜드", "패션 잡지", "코디 연구", "패션 블로그",
        "스트릿 패션", "미니멀 패션", "캐주얼 패션", "포멀 패션", "K-패션", "해외 패션", "핸드메이드 패션", "리폼/업사이클", "패션 역사", "패션 사진"
      ],
    },
    {
      name: "여행/자연",
      items: [
        "국내 여행", "해외 여행", "배낭여행", "캠핑", "글램핑", "호캉스", "등산", "해변 여행", "도시 여행", "문화 유적지",
        "자연 관찰", "별 관측", "일출/일몰", "사진 여행", "미식 여행", "온천/스파", "트레킹", "섬 여행", "겨울 여행", "여행 계획"
      ],
    },
    {
      name: "웰니스/힐링",
      items: [
        "명상", "요가", "마사지", "아로마테라피", "힐링 여행", "온천/스파", "숲 치유", "음악 치료", "미술 치료", "독서 치료",
        "마음챙김", "스트레스 관리", "수면 개선", "호흡법", "태극권", "기공", "차크라", "수정/파워스톤", "힐링 음악", "자연 치유"
      ],
    },
    {
      name: "반려동물",
      items: [
        "강아지 키우기", "고양이 키우기", "반려견 훈련", "펫샵 방문", "동물병원", "반려동물 용품", "펫 카페", "반려동물 사진", "반려동물 교육", "동물 보호",
        "새 키우기", "물고기 키우기", "햄스터 키우기", "토끼 키우기", "파충류", "펫 그루밍", "펫 호텔", "반려동물 보험", "동물 행동학", "반려동물 건강"
      ],
    },
    {
      name: "개발/테크",
      items: [
        "프로그래밍", "웹 개발", "앱 개발", "게임 개발", "AI/머신러닝", "데이터 분석", "클라우드", "블록체인", "IoT", "로봇공학",
        "프론트엔드", "백엔드", "풀스택", "DevOps", "사이버보안", "UI/UX", "모바일", "VR/AR", "빅데이터", "오픈소스"
      ],
    },
    {
      name: "심리/철학",
      items: [
        "심리학", "철학", "종교학", "윤리학", "인문학", "사회학", "인류학", "정신분석", "인지과학", "행동경제학",
        "실존철학", "동양철학", "서양철학", "현대철학", "불교", "기독교", "이슬람", "힌두교", "명상철학", "생명윤리"
      ],
    },
    {
      name: "사회/가치관",
      items: [
        "환경보호", "사회봉사", "기부", "인권", "평등", "다양성", "지속가능성", "사회정의", "공동체", "민주주의",
        "페미니즘", "LGBTQ+", "난민 지원", "동물권", "기후변화", "재활용", "제로웨이스트", "공정무역", "사회적경제", "시민운동"
      ],
    },
    {
      name: "공부/학습",
      items: [
        "언어 학습", "자격증 취득", "온라인 강의", "도서관", "스터디", "시험 준비", "논문 작성", "연구", "학회 참석", "세미나",
        "영어", "중국어", "일본어", "프랑스어", "독일어", "스페인어", "코딩", "수학", "과학", "역사"
      ],
    },
    {
      name: "커리어/자기계발",
      items: [
        "취업 준비", "이직", "창업", "네트워킹", "멘토링", "코칭", "리더십", "커뮤니케이션", "프레젠테이션", "협상",
        "경영", "마케팅", "영업", "기획", "전략", "프로젝트 관리", "시간 관리", "목표 설정", "성과 관리", "팀워크"
      ],
    },
    {
      name: "자동차/모빌리티",
      items: [
        "자동차", "오토바이", "자전거", "전기차", "하이브리드", "튜닝", "드라이빙", "모터스포츠", "카레이싱", "바이크 투어",
        "자동차 리뷰", "신차 정보", "중고차", "자동차 보험", "정비", "세차", "카 캠핑", "로드트립", "드라이브", "교통"
      ],
    },
    {
      name: "뷰티/미용",
      items: [
        "스킨케어", "메이크업", "헤어스타일", "네일아트", "향수", "에스테틱", "피부관리", "다이어트", "성형", "뷰티 제품",
        "K-뷰티", "화장품 리뷰", "뷰티 유튜버", "미용실", "피부과", "헤어샵", "네일샵", "마사지", "왁싱", "반영구"
      ],
    },
  ];

  // 라이프스타일 카테고리별 아이콘 매핑
  const LIFESTYLE_CATEGORY_ICONS = {
    "인간관계 스타일": "🤝",
    "소비/금전 습관": "💰", 
    "생활 리듬": "🕐",
    "자기계발 성장욕구": "📈"
  };

  // 라이프스타일 카테고리 및 항목 프리셋
  const LIFESTYLE_CATEGORIES = [
    {
      name: "인간관계 스타일",
      items: [
        "사람을 자주 만나는 편이다", "친한 사람과 가깝 만난다", "혼자 있는 시간을 좋아한다", "스킨십(3-5점)을 좋아한다", "대규모 모임을 좋아한다",
        "혼자 커피 가는 것을 좋아한다", "모르는 사람과 쉽게 친해진다", "새로운 모임에 부담을 느낀다", "인간적 체계 하는 편이다", "말도 안 맞는 일로",
        "연인을 까닭없이는 편이다", "친구 만난 체계관 한다", "메시지나 진화가 많한다", "가족과 자주 연라하는 편이다", "연구과제 산업하는 자료를 재치한다",
        "관계를 유지하는 데 에너지가 든다", "관계에 맞는 데 큰 부담이 있다", "감정을 쉽게하는 편이다", "감정을 자킬 해결하치 한다", "오래된 인연을 소홀히 여긴다"
      ],
    },
    {
      name: "소비/금전 습관",
      items: [
        "소비를 아키는 편이다", "필요한 것만 소비한다", "관심사에 돈을 아끼지 않다", "충동구매를 자주 한다", "저축을 꾸준히 하는 편이다",
        "주식/부채에 관심이 있다", "신용카드보다 체크카드를 선호한다", "플렉스를 즐기는 편이다", "명품 브랜드에 관심이 많다", "저렴크루를 게시 중요시한다",
        "경제적 자담을 중요하게 생각한다", "소득한을 한다", "세일 정보를 자주 확인한다", "중고거래를 자주 이용한다", "세로운 브랜드에 마무 관심이 한다",
        "예/활적인 소비를 지원한다", "진구가족에게 선물을 자주한다", "선물 받을 때 덮음을 높다", "카폐가능한 라이프 신절 같다", "향상 소비습관을 바꾸고 있다"
      ],
    },
    {
      name: "생활 리듬",
      items: [
        "아침형 인간이다", "저녁형 인간이다", "규칙적인 생활을 한다", "생활 리듬이 불규칙하다", "주말에도 규칙적으로 생활한다",
        "주말은 무조건 쉬신이다", "늦잠을 자주 잔다", "낮잠을 거의 자지 않는다", "야식을 챙겨 먹는다", "아침을 거의 먹지 않는다",
        "정해진 요소 루틴이 있다", "운동 없이 생활한다", "수면시간이 충분한 편이다", "수면 부족을 자주 겪는다", "하루 일과를 계획하는 편이다",
        "하루하루을임으로 보내는 편이다", "일찍 일어나서 여유롭 즐간다", "늦게 일어나서 급하게 준비를 한다", "커피 없이 못 버틴다", "커피만 십취를 조절하려고 한다"
      ],
    },
    {
      name: "자기계발 성장욕구",
      items: [
        "목표를 세우고 꾸준히 관리한다", "평상에 업적한 한다", "자유롭게 살고 싶다", "새로운 것을 배우는 걸 좋아한다", "사석을 얻는 데 관심이 많다",
        "외국어 학습을 시도 중이다", "취미를 건물직으로 발전시키고 싶다", "창업/부업에 대해 관심이 많다", "직업 등에 배우는 걸 좋아한다", "유튜브/강의를 즐겨본다",
        "독하이 잘 맞는 편이다", "스터디나 그룹활동을 선호한다", "일상 루틴에만 만족한다", "올해내을 꾸준히 사용한다", "변화를/방드를 받는 걸 선호한다",
        "스스로를 독하는 편이다", "경쟁보다 협업을 선호한다", "매분 새로운 측구를 새간다", "개별 새우는 건 즐긴만 실행이 어렵다", "성장보다 현재를 즐기고 싶다"
      ],
    },
  ];

  const PROFILE_COLORS = [
    "#f87171", "#fbbf24", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#f9a8d4", "#fcd34d", "#bef264", "#5eead4", "#60a5fa", "#a3e635"
  ];

  // 회원가입 내부 페이지 단계
  const [step, setStep] = useState(0);
  const steps = ["기본정보", "MBTI", "관심사 카테고리", "관심사 선택", "라이프스타일 카테고리", "라이프스타일 선택", "프로필 컬러"];
  // 관심사/라이프스타일 카테고리 인덱스
  const [interestCategoryIndex, setInterestCategoryIndex] = useState(0);
  const [selectedInterestCategories, setSelectedInterestCategories] = useState<string[]>([]);
  const [lifestyleCategoryIndex, setLifestyleCategoryIndex] = useState(0);
  const [selectedLifestyleCategories, setSelectedLifestyleCategories] = useState<string[]>([]);
  // 카테고리 검색 상태
  const [interestSearch, setInterestSearch] = useState("");
  const [lifestyleSearch, setLifestyleSearch] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    username: "",
    birth: "",
    height: "",
    weight: "",
    gender: "",
    job: "",
    jobOther: "",
    education: "",
    educationOther: "",
    mbti: "",
    interests: [] as { category: string; item: string }[],
    lifestyle: [] as { category: string; item: string }[],
    profileColor: PROFILE_COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
  // 닉네임 실시간 상태 (중복 여부 등 확장을 대비)
  const [usernameStatus, setUsernameStatus] = useState<{ validFormat: boolean; isEmailFormat: boolean }>({ validFormat: true, isEmailFormat: false });
  const [usernameAvailability, setUsernameAvailability] = useState<{ loading: boolean; available: boolean | null; error?: string }>({ loading: false, available: null });
  // 마지막으로 성공/실패 여부와 무관하게 중복 확인을 수행한 username 캐시
  const [lastCheckedUsername, setLastCheckedUsername] = useState<string | null>(null);
  const usernameCheckApi = useApi<{ available: boolean }>("get", "/username/check");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // 닉네임 특별 처리
    if (name === 'username') {
      // 입력값 그대로 두되 후속 검증 상태만 갱신
      const usernameRaw = value;
      const isEmailLike = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(usernameRaw);
      // 영문만 허용 (요구사항: 영문만) - 빈 문자열은 일단 허용 (required는 별도)
      const alphaOnlyRegex = /^[A-Za-z]*$/; // 부분 입력 허용
      const validFormat = alphaOnlyRegex.test(usernameRaw);
      setUsernameStatus({ validFormat, isEmailFormat: isEmailLike });
      setForm({ ...form, [name]: usernameRaw });
      // 기존 에러 제거 또는 재설정
      if (stepErrors.username) {
        const newErrors = { ...stepErrors };
        delete newErrors.username;
        setStepErrors(newErrors);
      }
      return;
    }
    setForm({ ...form, [name]: value });
    
    // 해당 필드의 에러 제거
    if (stepErrors[name]) {
      const newErrors = { ...stepErrors };
      delete newErrors[name];
      setStepErrors(newErrors);
    }
  };

  // 단계별 검증 함수
  const validateStep = (stepIndex: number): boolean => {
    const errors: { [key: string]: string } = {};
    
    switch (stepIndex) {
      case 0: // 기본정보
        if (!form.email.trim()) errors.email = "이메일을 입력해주세요.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "올바른 이메일 형식을 입력해주세요.";
        
  if (!form.username.trim()) errors.username = "닉네임을 입력해주세요.";
  else if (!usernameStatus.validFormat) errors.username = "닉네임은 영문 알파벳만 사용할 수 있습니다.";
  else if (usernameStatus.isEmailFormat) errors.username = "이메일 형식은 닉네임으로 사용할 수 없습니다.";
  else if (!usernameAvailability.loading && usernameAvailability.available === false) errors.username = "이미 사용 중인 닉네임입니다.";
        
        if (!form.password) errors.password = "비밀번호를 입력해주세요.";
        else if (form.password.length < 6) errors.password = "비밀번호는 6자 이상이어야 합니다.";
        
        if (!form.passwordConfirm) errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
        else if (form.password !== form.passwordConfirm) errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
        
        if (!form.gender) errors.gender = "성별을 선택해주세요.";
        if (!form.job) errors.job = "직업을 선택해주세요.";
        else if (form.job === "기타" && !form.jobOther.trim()) errors.jobOther = "직업을 입력해주세요.";
        
        if (!form.education) errors.education = "학력을 선택해주세요.";
        else if (form.education === "기타" && !form.educationOther.trim()) errors.educationOther = "학력을 입력해주세요.";
        break;
        
      case 1: // MBTI
        if (form.mbti.length !== 4) {
          errors.mbti = "MBTI 4자리를 모두 선택해주세요.";
        }
        break;
        
      case 2: // 관심사 카테고리
        // 이미 관심사가 선택되어 있으면 통과, 아니면 최소 1개 카테고리 선택 필요
        if (form.interests.length === 0 && selectedInterestCategories.length === 0) {
          errors.interestCategories = "최소 1개 이상의 관심사 카테고리를 선택해주세요.";
        }
        break;
        
      case 3: // 관심사 선택
        if (selectedInterestCategories.length === 0) {
          errors.interestCategories = "최소 1개 이상의 관심사 카테고리를 선택해주세요.";
        } else if (form.interests.length === 0) {
          errors.interests = "선택한 카테고리에서 최소 1개 이상의 관심사를 선택해주세요.";
        }
        break;
        
      case 4: // 라이프스타일 카테고리
        // 이미 라이프스타일이 선택되어 있으면 통과, 아니면 최소 1개 카테고리 선택 필요
        if (form.lifestyle.length === 0 && selectedLifestyleCategories.length === 0) {
          errors.lifestyleCategories = "최소 1개 이상의 라이프스타일 카테고리를 선택해주세요.";
        }
        break;
        
      case 5: // 라이프스타일 선택
        if (selectedLifestyleCategories.length === 0) {
          errors.lifestyleCategories = "최소 1개 이상의 라이프스타일 카테고리를 선택해주세요.";
        } else if (form.lifestyle.length === 0) {
          errors.lifestyle = "선택한 카테고리에서 최소 1개 이상의 라이프스타일을 선택해주세요.";
        }
        break;
        
      case 6: // 프로필 컬러 (항상 유효)
        break;
    }
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 다음 단계로 이동하는 함수
  const handleNextStep = () => {
    if (validateStep(step)) {
      // 관심사 카테고리 선택 단계에서 다음으로 넘어갈 때
      if (step === 2) {
        // 이미 관심사가 선택되어 있으면 라이프스타일 카테고리 화면(4단계)로 건너뛰기
        if (form.interests.length > 0) {
          setStep(4);
        } else {
          // 관심사가 없으면 관심사 선택 화면(3단계)로 이동
          setInterestCategoryIndex(0);
          setStep(3);
        }
      } 
      // 라이프스타일 카테고리 선택 단계에서 다음으로 넘어갈 때
      else if (step === 4) {
        // 이미 라이프스타일이 선택되어 있으면 프로필 컬러 화면(6단계)로 건너뛰기
        if (form.lifestyle.length > 0) {
          setStep(6);
        } else {
          // 라이프스타일이 없으면 라이프스타일 선택 화면(5단계)로 이동
          setLifestyleCategoryIndex(0);
          setStep(5);
        }
      }
      else {
        setStep(step + 1);
      }
    }
  };

  // 닉네임 중복 검사 (debounce 500ms)
  React.useEffect(() => {
    // 입력이 없거나 형식이 유효하지 않으면 초기화
    if (!form.username || !usernameStatus.validFormat || usernameStatus.isEmailFormat) {
      setUsernameAvailability({ loading: false, available: null });
      setLastCheckedUsername(null);
      return;
    }
    // 캐시된 값과 동일하면 재요청 생략
    if (lastCheckedUsername === form.username) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setUsernameAvailability(prev => ({ ...prev, loading: true, error: undefined }));
      try {
        const res = await usernameCheckApi.request(undefined, { params: { username: form.username } });
        if (!cancelled) {
          setUsernameAvailability({ loading: false, available: res.available });
          setLastCheckedUsername(form.username);
        }
      } catch (err: any) {
        if (!cancelled) {
          setUsernameAvailability({ loading: false, available: null, error: err?.response?.data?.message || '확인 실패' });
          setLastCheckedUsername(form.username); // 오류도 캐시 (사용자 입력 변경 전 재시도 방지)
        }
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.username, usernameStatus.validFormat, usernameStatus.isEmailFormat, usernameCheckApi, lastCheckedUsername]);

  // username 입력 변경 시 캐시 처리: 이미 onChange에서 form.username이 바뀌면 effect dependency로 lastCheckedUsername와 다르면 재검사 준비됨

  // 라이프스타일 카테고리 선택/해제
  const toggleLifestyleCategory = (categoryName: string) => {
    if (selectedLifestyleCategories.includes(categoryName)) {
      setSelectedLifestyleCategories(selectedLifestyleCategories.filter(name => name !== categoryName));
      // 해당 카테고리의 모든 라이프스타일 제거
      setForm({
        ...form,
        lifestyle: form.lifestyle.filter(lifestyle => lifestyle.category !== categoryName)
      });
    } else {
      setSelectedLifestyleCategories([...selectedLifestyleCategories, categoryName]);
      // 바로 해당 카테고리의 세부 라이프스타일 선택 화면으로 이동
      const categoryIndex = LIFESTYLE_CATEGORIES.findIndex(cat => cat.name === categoryName);
      setLifestyleCategoryIndex(categoryIndex);
      setStep(5); // 라이프스타일 선택 단계로 이동
    }
    
    // 라이프스타일 카테고리 에러 제거
    if (stepErrors.lifestyleCategories) {
      const newErrors = { ...stepErrors };
      delete newErrors.lifestyleCategories;
      setStepErrors(newErrors);
    }
  };

  // 관심사 카테고리 선택/해제
  const toggleInterestCategory = (categoryName: string) => {
    if (selectedInterestCategories.includes(categoryName)) {
      setSelectedInterestCategories(selectedInterestCategories.filter(name => name !== categoryName));
      // 해당 카테고리의 모든 관심사 제거
      setForm({
        ...form,
        interests: form.interests.filter(interest => interest.category !== categoryName)
      });
    } else {
      setSelectedInterestCategories([...selectedInterestCategories, categoryName]);
      // 바로 해당 카테고리의 세부 관심사 선택 화면으로 이동
      const categoryIndex = INTEREST_CATEGORIES.findIndex(cat => cat.name === categoryName);
      setInterestCategoryIndex(categoryIndex);
      setStep(3); // 관심사 선택 단계로 이동
    }
    
    // 관심사 카테고리 에러 제거
    if (stepErrors.interestCategories) {
      const newErrors = { ...stepErrors };
      delete newErrors.interestCategories;
      setStepErrors(newErrors);
    }
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
      // 관심사 에러 제거
      if (stepErrors.interests) {
        const newErrors = { ...stepErrors };
        delete newErrors.interests;
        setStepErrors(newErrors);
      }
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
      // 라이프스타일 에러 제거
      if (stepErrors.lifestyle) {
        const newErrors = { ...stepErrors };
        delete newErrors.lifestyle;
        setStepErrors(newErrors);
      }
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
        birthDate: form.birth, // 생년월일 추가
        bio: `안녕하세요! ${form.username}입니다.`, // 기본 자기소개 설정
        height: form.height,
        weight: form.weight,
        gender: form.gender, // 성별 추가
        job: form.job === "기타" ? form.jobOther : form.job,
        education: form.education === "기타" ? form.educationOther : form.education,
        interests,
        lifestyle,
        profileColor: form.profileColor,
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
              {step === 2 && "관심 있는 카테고리를 선택해 주세요."}
              {step === 3 && "선택한 카테고리의 세부 관심사를 선택해 주세요."}
              {step === 4 && "라이프스타일 카테고리를 선택해 주세요."}
              {step === 5 && "선택한 카테고리의 세부 라이프스타일을 선택해 주세요."}
              {step === 6 && "프로필 컬러를 선택해 주세요."}
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
              <div className="flex flex-col">
                <input
                  type="email"
                  name="email"
                  placeholder="이메일"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {stepErrors.email && <span className="text-red-500 text-xs mt-1">{stepErrors.email}</span>}
              </div>
              
              <div className="flex flex-col">
                <input
                  type="text"
                  name="username"
                  placeholder="닉네임"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {stepErrors.username && <span className="text-red-500 text-xs mt-1">{stepErrors.username}</span>}
                {!stepErrors.username && form.username && !usernameStatus.validFormat && (
                  <span className="text-red-500 text-xs mt-1">영문 알파벳만 입력 가능합니다.</span>
                )}
                {!stepErrors.username && form.username && usernameStatus.isEmailFormat && usernameStatus.validFormat && (
                  <span className="text-red-500 text-xs mt-1">이메일 형식은 닉네임으로 사용할 수 없습니다.</span>
                )}
                {!stepErrors.username && form.username && usernameStatus.validFormat && !usernameStatus.isEmailFormat && (
                  <span className="text-xs mt-1">
                    {usernameAvailability.loading && <span className="text-gray-500">중복 확인 중...</span>}
                    {!usernameAvailability.loading && usernameAvailability.available === true && <span className="text-green-600">사용 가능한 닉네임입니다.</span>}
                    {!usernameAvailability.loading && usernameAvailability.available === false && <span className="text-red-500">이미 사용 중인 닉네임입니다.</span>}
                    {usernameAvailability.error && <span className="text-orange-500">확인 오류: {usernameAvailability.error}</span>}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col">
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {stepErrors.password && <span className="text-red-500 text-xs mt-1">{stepErrors.password}</span>}
              </div>
              
              <div className="flex flex-col">
                <input
                  type="password"
                  name="passwordConfirm"
                  placeholder="비밀번호 확인"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.passwordConfirm ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {stepErrors.passwordConfirm && <span className="text-red-500 text-xs mt-1">{stepErrors.passwordConfirm}</span>}
              </div>
              
              <input
                type="date"
                name="birth"
                placeholder="생년월일"
                value={form.birth}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
              
              <div className="md:col-span-2">
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="col-span-3 sm:col-span-1">
                    <input
                      type="text"
                      name="height"
                      placeholder="신장 (cm)"
                      value={form.height}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm md:text-base"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <input
                      type="text"
                      name="weight"
                      placeholder="몸무게 (kg)"
                      value={form.weight}
                      onChange={handleChange}
                      className="w-full px-4 py-3 md:py-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm md:text-base"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex flex-col">
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 md:py-4 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition text-sm md:text-base ${
                        stepErrors.gender ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    >
                      <option value="">성별</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                    {stepErrors.gender && <span className="text-red-500 text-xs mt-1 whitespace-nowrap">{stepErrors.gender}</span>}
                  </div>
                </div>
                <div className="mt-1 text-[10px] md:text-xs text-gray-500 px-1">정확한 매칭을 위해 키/몸무게/성별 정보를 입력해주세요. (선택 사항 가능)</div>
              </div>
              
              <div className="flex flex-col">
                <select
                  name="job"
                  value={form.job}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.job ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
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
                {stepErrors.job && <span className="text-red-500 text-xs mt-1">{stepErrors.job}</span>}
                
                {form.job === "기타" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="jobOther"
                      placeholder="직업을 입력해주세요"
                      value={form.jobOther}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                        stepErrors.jobOther ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {stepErrors.jobOther && <span className="text-red-500 text-xs mt-1">{stepErrors.jobOther}</span>}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <select
                  name="education"
                  value={form.education}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                    stepErrors.education ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
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
                {stepErrors.education && <span className="text-red-500 text-xs mt-1">{stepErrors.education}</span>}
                
                {form.education === "기타" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="educationOther"
                      placeholder="학력을 입력해주세요"
                      value={form.educationOther}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-100 outline-none transition ${
                        stepErrors.educationOther ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {stepErrors.educationOther && <span className="text-red-500 text-xs mt-1">{stepErrors.educationOther}</span>}
                  </div>
                )}
              </div>
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
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
                        // MBTI 에러 제거
                        if (stepErrors.mbti) {
                          const newErrors = { ...stepErrors };
                          delete newErrors.mbti;
                          setStepErrors(newErrors);
                        }
                      }}
                    >J</button>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">선택: <span className="font-semibold">{form.mbti}</span></div>
              {stepErrors.mbti && <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.mbti}</div>}
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-6 items-center">
              <div className="text-lg font-semibold text-blue-700 mb-2">관심사 카테고리 선택</div>
              {/* 검색 인풋 */}
              <div className="w-full max-w-2xl mb-2">
                <input
                  type="text"
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  placeholder="카테고리 검색..."
                  className="w-full px-3 py-2 rounded-md border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  aria-label="관심사 카테고리 검색"
                />
              </div>
              {/* 선택된 카테고리 칩 */}
              {selectedInterestCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full max-w-2xl mb-2" aria-label="선택된 관심사 카테고리" role="list">
                  {selectedInterestCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      role="listitem"
                      aria-label={`${cat} 선택 해제`}
                      className="px-2 py-1 bg-blue-600 text-white rounded-full text-[11px] flex items-center gap-1 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onClick={() => toggleInterestCategory(cat)}
                    >
                      <span>{cat}</span>
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-600 mb-4 text-center">
                관심 있는 카테고리를 클릭하면 바로 세부 관심사를 선택할 수 있습니다.
                {form.interests.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded">
                    ✅ {form.interests.length}개의 관심사가 선택되었습니다. "다음" 버튼을 누르면 라이프스타일 단계로 이동합니다.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full max-w-3xl" role="list" aria-label="관심사 카테고리 목록">
                {INTEREST_CATEGORIES.filter(c => c.name.toLowerCase().includes(interestSearch.toLowerCase())).map((category) => {
                  const selected = selectedInterestCategories.includes(category.name);
                  return (
                    <button
                      type="button"
                      key={category.name}
                      className={`px-2 py-3 rounded-lg border text-[11px] leading-tight flex flex-col items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                        selected
                          ? "bg-blue-500 text-white border-blue-600 shadow"
                          : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                      }`}
                      aria-pressed={selected}
                      aria-label={`관심사 카테고리: ${category.name}${selected ? ' (선택됨)' : ''}`}
                      onClick={() => toggleInterestCategory(category.name)}
                    >
                      <span className="text-xl">{CATEGORY_ICONS[category.name as keyof typeof CATEGORY_ICONS]}</span>
                      <span className="font-semibold truncate w-full text-center">{category.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-sm text-gray-500 mt-4">
                선택된 카테고리: {selectedInterestCategories.length}개
              </div>
              {stepErrors.interestCategories && (
                <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.interestCategories}</div>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-6 items-center">
              {/* 카테고리 네비게이션 - 전체 카테고리에서 선택 */}
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
              
              {/* 카테고리 선택 상태 표시 */}
              <div className="text-sm text-gray-600 mb-2">
                {selectedInterestCategories.includes(INTEREST_CATEGORIES[interestCategoryIndex].name) 
                  ? "✅ 선택된 카테고리" 
                  : "❌ 미선택 카테고리"
                }
              </div>
              
              {/* 카테고리 선택/해제 버튼 */}
              <button
                type="button"
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedInterestCategories.includes(INTEREST_CATEGORIES[interestCategoryIndex].name)
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => {
                  const categoryName = INTEREST_CATEGORIES[interestCategoryIndex].name;
                  if (selectedInterestCategories.includes(categoryName)) {
                    setSelectedInterestCategories(selectedInterestCategories.filter(name => name !== categoryName));
                    // 해당 카테고리의 모든 관심사 제거
                    setForm({
                      ...form,
                      interests: form.interests.filter(interest => interest.category !== categoryName)
                    });
                  } else {
                    setSelectedInterestCategories([...selectedInterestCategories, categoryName]);
                  }
                }}
              >
                {selectedInterestCategories.includes(INTEREST_CATEGORIES[interestCategoryIndex].name)
                  ? "카테고리 선택 해제"
                  : "카테고리 선택하기"
                }
              </button>
              
              {/* 세부 관심사 선택 영역 */}
              {selectedInterestCategories.includes(INTEREST_CATEGORIES[interestCategoryIndex].name) && (
                <div className="bg-blue-50 rounded-xl p-3 flex flex-col items-center w-full max-w-lg">
                  <div className="font-bold text-blue-700 mb-2">{INTEREST_CATEGORIES[interestCategoryIndex].name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full text-xs">
                    {INTEREST_CATEGORIES[interestCategoryIndex].items.map((item) => {
                      const selected = form.interests.some((i) => i.category === INTEREST_CATEGORIES[interestCategoryIndex].name && i.item === item);
                      return (
                        <button
                          type="button"
                          key={item}
                          className={`w-full px-2 py-1 rounded-md border text-[11px] leading-tight transition ${
                            selected ? "bg-blue-500 text-white border-blue-600" : "bg-white text-blue-700 border-blue-200 hover:bg-blue-100"
                          }`}
                          onClick={() => toggleInterest(INTEREST_CATEGORIES[interestCategoryIndex].name, item)}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  {form.interests.length > 0 && (
                    <div className="flex gap-2 mt-3 w-full">
                      <button
                        type="button"
                        className="flex-1 py-2 rounded-md bg-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-400"
                        onClick={() => setStep(2)}
                      >카테고리 목록</button>
                      {/* '다음 단계' 버튼 제거 (요구사항: 세부 선택 화면에서는 다음 단계 버튼 숨김) */}
                    </div>
                  )}
                </div>
              )}
              
              {/* 전체 선택 현황 */}
              <div className="text-xs text-gray-500 mt-1">
                선택된 카테고리: {selectedInterestCategories.length}개 | 
                선택된 관심사: {form.interests.length}개
              </div>
              
              {/* 카테고리 선택 화면으로 돌아가기 */}
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm hover:bg-gray-600 transition"
                onClick={() => setStep(2)}
              >
                카테고리 선택 화면으로 돌아가기
              </button>
              
              {stepErrors.interestCategories && <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.interestCategories}</div>}
              {stepErrors.interests && <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.interests}</div>}
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col gap-6 items-center">
              <div className="text-lg font-semibold text-orange-700 mb-2">라이프스타일 카테고리 선택</div>
              {/* 검색 인풋 */}
              <div className="w-full max-w-lg mb-2">
                <input
                  type="text"
                  value={lifestyleSearch}
                  onChange={(e) => setLifestyleSearch(e.target.value)}
                  placeholder="카테고리 검색..."
                  className="w-full px-3 py-2 rounded-md border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
                  aria-label="라이프스타일 카테고리 검색"
                />
              </div>
              {/* 선택된 라이프스타일 카테고리 칩 */}
              {selectedLifestyleCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full max-w-lg mb-2" aria-label="선택된 라이프스타일 카테고리" role="list">
                  {selectedLifestyleCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      role="listitem"
                      aria-label={`${cat} 선택 해제`}
                      className="px-2 py-1 bg-orange-500 text-white rounded-full text-[11px] flex items-center gap-1 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                      onClick={() => toggleLifestyleCategory(cat)}
                    >
                      <span>{cat}</span>
                      <span aria-hidden>×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-600 mb-4 text-center">
                관심 있는 라이프스타일 카테고리를 클릭하면 바로 세부 라이프스타일을 선택할 수 있습니다.
                {form.lifestyle.length > 0 && (
                  <div className="mt-2 p-2 bg-green-50 text-green-700 rounded">
                    ✅ {form.lifestyle.length}개의 라이프스타일이 선택되었습니다. "다음" 버튼을 누르면 프로필 컬러 단계로 이동합니다.
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 w-full max-w-2xl" role="list" aria-label="라이프스타일 카테고리 목록">
                {LIFESTYLE_CATEGORIES.filter(c => c.name.toLowerCase().includes(lifestyleSearch.toLowerCase())).map((category) => {
                  const selected = selectedLifestyleCategories.includes(category.name);
                  return (
                    <button
                      type="button"
                      key={category.name}
                      className={`px-2 py-3 rounded-lg border text-[11px] leading-tight flex flex-col items-center gap-1 transition focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                        selected
                          ? "bg-orange-500 text-white border-orange-600 shadow"
                          : "bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                      }`}
                      aria-pressed={selected}
                      aria-label={`라이프스타일 카테고리: ${category.name}${selected ? ' (선택됨)' : ''}`}
                      onClick={() => toggleLifestyleCategory(category.name)}
                    >
                      <span className="text-xl">{LIFESTYLE_CATEGORY_ICONS[category.name as keyof typeof LIFESTYLE_CATEGORY_ICONS]}</span>
                      <span className="font-semibold truncate w-full text-center">{category.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-sm text-gray-500 mt-4">
                선택된 카테고리: {selectedLifestyleCategories.length}개
              </div>
              {stepErrors.lifestyleCategories && (
                <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.lifestyleCategories}</div>
              )}
            </div>
          )}
          {step === 5 && (
            <div className="flex flex-col gap-6 items-center">
              {/* 카테고리 네비게이션 - 전체 카테고리에서 선택 */}
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
              
              {/* 카테고리 선택 상태 표시 */}
              <div className="text-sm text-gray-600 mb-2">
                {selectedLifestyleCategories.includes(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name) 
                  ? "✅ 선택된 카테고리" 
                  : "❌ 미선택 카테고리"
                }
              </div>
              
              {/* 카테고리 선택/해제 버튼 */}
              <button
                type="button"
                className={`px-6 py-2 rounded-lg font-semibold text-sm transition ${
                  selectedLifestyleCategories.includes(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name)
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
                onClick={() => {
                  const categoryName = LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name;
                  if (selectedLifestyleCategories.includes(categoryName)) {
                    setSelectedLifestyleCategories(selectedLifestyleCategories.filter(name => name !== categoryName));
                    // 해당 카테고리의 모든 라이프스타일 제거
                    setForm({
                      ...form,
                      lifestyle: form.lifestyle.filter(lifestyle => lifestyle.category !== categoryName)
                    });
                  } else {
                    setSelectedLifestyleCategories([...selectedLifestyleCategories, categoryName]);
                  }
                }}
              >
                {selectedLifestyleCategories.includes(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name)
                  ? "카테고리 선택 해제"
                  : "카테고리 선택하기"
                }
              </button>
              
              {/* 세부 라이프스타일 선택 영역 */}
              {selectedLifestyleCategories.includes(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name) && (
                <div className="bg-orange-50 rounded-xl p-3 flex flex-col items-center w-full max-w-lg">
                  <div className="font-bold text-orange-700 mb-2">{LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full text-xs">
                    {LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].items.map((item) => {
                      const selected = form.lifestyle.some((i) => i.category === LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name && i.item === item);
                      return (
                        <button
                          type="button"
                          key={item}
                          className={`w-full px-2 py-1 rounded-md border text-[11px] leading-tight transition ${
                            selected ? "bg-orange-500 text-white border-orange-600" : "bg-white text-orange-700 border-orange-200 hover:bg-orange-100"
                          }`}
                          onClick={() => toggleLifestyle(LIFESTYLE_CATEGORIES[lifestyleCategoryIndex].name, item)}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  {form.lifestyle.length > 0 && (
                    <div className="flex gap-2 mt-3 w-full">
                      <button
                        type="button"
                        className="flex-1 py-2 rounded-md bg-gray-300 text-gray-800 text-xs font-semibold hover:bg-gray-400"
                        onClick={() => setStep(4)}
                      >카테고리 목록</button>
                      {/* '다음 단계' 버튼 제거 (요구사항: 세부 선택 화면에서는 다음 단계 버튼 숨김) */}
                    </div>
                  )}
                </div>
              )}
              
              {/* 전체 선택 현황 */}
              <div className="text-xs text-gray-500 mt-1">
                선택된 카테고리: {selectedLifestyleCategories.length}개 | 
                선택된 라이프스타일: {form.lifestyle.length}개
              </div>
              
              {/* 카테고리 선택 화면으로 돌아가기 */}
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-500 text-white text-sm hover:bg-gray-600 transition"
                onClick={() => setStep(4)}
              >
                카테고리 선택 화면으로 돌아가기
              </button>
              
              {stepErrors.lifestyleCategories && <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.lifestyleCategories}</div>}
              {stepErrors.lifestyle && <div className="text-red-500 text-sm mt-2 text-center">{stepErrors.lifestyle}</div>}
            </div>
          )}
          {step === 6 && (
            <div className="flex flex-col items-center md:items-start w-full max-w-xl mx-auto">
              <label className="block font-semibold mb-2 text-gray-700">프로필 컬러</label>
              <p className="text-xs text-gray-500 mb-3">원하는 색상을 하나 선택해 주세요.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {PROFILE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`색상 ${color} 선택`}
                    className={`w-10 h-10 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${form.profileColor === color ? "border-blue-600 ring-2 ring-blue-300 scale-110" : "border-gray-200 hover:scale-105"}`}
                    style={{ background: color }}
                    onClick={() => setForm({ ...form, profileColor: color })}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="text-gray-600">선택된 색상:</span>
                <span className="w-6 h-6 rounded-full border" style={{ background: form.profileColor }} />
                <span className="font-mono text-gray-700 text-xs">{form.profileColor}</span>
              </div>
            </div>
          )}
          {/* 하단 버튼/상태 */}
          {![3,5].includes(step) && (
            <div className="flex gap-2 mt-4 md:mt-8">
              {step > 0 && (
                <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold text-lg shadow hover:bg-gray-300 transition">이전</button>
              )}
              {step < steps.length - 1 && (
                <button type="button" onClick={handleNextStep} className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold text-lg shadow hover:bg-blue-700 transition">다음</button>
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
          )}
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
