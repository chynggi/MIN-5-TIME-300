'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../profile.module.css';
import { profileApi } from '../../../../services/profile-api';

interface Interest {
  category: string;
  item: string;
}

export default function InterestsEditPage() {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 회원가입과 동일한 관심사 카테고리
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

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      const profile = await profileApi.getProfile();
      const userInterests = profile.interests || [];
      
      // 기존 선택된 관심사를 카테고리-항목 형태로 변환
      const selectedInterests = userInterests.map(interest => {
        // "카테고리 - 항목" 형식으로 저장되어 있다고 가정
        const [category, item] = interest.interest.split(' - ');
        return { category: category || '', item: item || interest.interest };
      });
      
      setInterests(selectedInterests);
      setLoading(false);
    } catch (err) {
      console.error('관심사 로드 실패:', err);
      setLoading(false);
    }
  };

  const toggleInterest = (category: string, item: string) => {
    const exists = interests.find((i) => i.category === category && i.item === item);
    if (exists) {
      setInterests(interests.filter((i) => !(i.category === category && i.item === item)));
    } else {
      setInterests([...interests, { category, item }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 관심사 priority 자동 부여 (카테고리-항목)
      const interestData = interests.map((interest, i) => ({
        interest: `${interest.category} - ${interest.item}`,
        priority: i + 1,
      }));

      await profileApi.updateInterests({
        interests: interestData
      });
      
      router.back();
    } catch (err) {
      console.error('관심사 저장 실패:', err);
      alert('관심사 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          관심사를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.editHeader}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ← 뒤로
        </button>
        <h1 className={styles.editTitle}>관심사</h1>
      </div>

      <div className={styles.editForm}>
        <div className={styles.signupSection}>
          {/* 카테고리 네비게이션 */}
          <div className={styles.categoryNav}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setCategoryIndex((idx) => Math.max(0, idx - 1))}
              disabled={categoryIndex === 0}
            >
              이전 카테고리
            </button>
            <span className={styles.categoryTitle}>
              {INTEREST_CATEGORIES[categoryIndex].name}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setCategoryIndex((idx) => Math.min(INTEREST_CATEGORIES.length - 1, idx + 1))}
              disabled={categoryIndex === INTEREST_CATEGORIES.length - 1}
            >
              다음 카테고리
            </button>
          </div>

          <div className={styles.categoryBox}>
            <div className={styles.categoryBoxTitle}>{INTEREST_CATEGORIES[categoryIndex].name}</div>
            <div className={styles.itemGrid}>
              {INTEREST_CATEGORIES[categoryIndex].items.map((item) => {
                const isSelected = interests.find(
                  (interest) => interest.category === INTEREST_CATEGORIES[categoryIndex].name && interest.item === item
                );
                return (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.itemChip} ${isSelected ? styles.itemChipSelected : ''}`}
                    onClick={() => toggleInterest(INTEREST_CATEGORIES[categoryIndex].name, item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.selectionCount}>선택된 관심사: {interests.length}개</div>
        </div>

        <button 
          className={styles.saveButton} 
          onClick={handleSave}
          disabled={saving || interests.length === 0}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
