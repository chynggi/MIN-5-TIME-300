'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../profile.module.css';
import { profileApi } from '../../../../services/profile-api';

interface Lifestyle {
  category: string;
  item: string;
}

export default function LifestyleEditPage() {
  const router = useRouter();
  const [lifestyle, setLifestyle] = useState<Lifestyle[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 회원가입과 동일한 라이프스타일 카테고리
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

  useEffect(() => {
    loadLifestyle();
  }, []);

  const loadLifestyle = async () => {
    try {
      const profile = await profileApi.getProfile();
      const userLifestyle = profile.lifestyle || [];
      
      // 기존 선택된 라이프스타일을 카테고리-항목 형태로 변환
      const selectedLifestyle = userLifestyle.map((life: any) => {
        // "카테고리 - 항목" 형식으로 저장되어 있다고 가정
        const [category, item] = life.question.split(' - ');
        return { category: category || '', item: item || life.question };
      });
      
      setLifestyle(selectedLifestyle);
      setLoading(false);
    } catch (err) {
      console.error('라이프스타일 로드 실패:', err);
      setLoading(false);
    }
  };

  const toggleLifestyle = (category: string, item: string) => {
    const exists = lifestyle.find((i) => i.category === category && i.item === item);
    if (exists) {
      setLifestyle(lifestyle.filter((i) => !(i.category === category && i.item === item)));
    } else {
      setLifestyle([...lifestyle, { category, item }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 라이프스타일 카테고리-항목
      const lifestyleData = lifestyle.map((life, i) => ({
        question: `${life.category} - ${life.item}`,
        answer: "선택",
      }));

      await profileApi.updateLifestyle({
        lifestyle: lifestyleData
      });
      
      router.back();
    } catch (err) {
      console.error('라이프스타일 저장 실패:', err);
      alert('라이프스타일 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.loadingContainer}>
          라이프스타일 정보를 불러오는 중...
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
        <h1 className={styles.editTitle}>라이프스타일</h1>
      </div>

      <div className={styles.editForm}>
        <div className={styles.signupSection}>
          {/* 라이프스타일 카테고리 네비게이션 */}
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
              {LIFESTYLE_CATEGORIES[categoryIndex].name}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setCategoryIndex((idx) => Math.min(LIFESTYLE_CATEGORIES.length - 1, idx + 1))}
              disabled={categoryIndex === LIFESTYLE_CATEGORIES.length - 1}
            >
              다음 카테고리
            </button>
          </div>

          <div className={styles.categoryBox} style={{ backgroundColor: '#fff5f5' }}>
            <div className={styles.categoryBoxTitle} style={{ color: '#c53030' }}>
              {LIFESTYLE_CATEGORIES[categoryIndex].name}
            </div>
            <div className={styles.itemGrid}>
              {LIFESTYLE_CATEGORIES[categoryIndex].items.map((item) => {
                const isSelected = lifestyle.find(
                  (life) => life.category === LIFESTYLE_CATEGORIES[categoryIndex].name && life.item === item
                );
                return (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.itemChip} ${isSelected ? styles.itemChipSelected : ''}`}
                    onClick={() => toggleLifestyle(LIFESTYLE_CATEGORIES[categoryIndex].name, item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.selectionCount}>선택된 라이프스타일: {lifestyle.length}개</div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#f9f9f9', borderRadius: '8px' }}>
          <small style={{ color: '#666', fontSize: '12px' }}>
            * 라이프스타일 설정은 아직 백엔드 구현 대기 중입니다.<br/>
            * 이 정보는 더 나은 매칭과 추천을 위해 사용됩니다.
          </small>
        </div>

        <button 
          className={styles.saveButton} 
          onClick={handleSave}
          disabled={saving || lifestyle.length === 0}
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
