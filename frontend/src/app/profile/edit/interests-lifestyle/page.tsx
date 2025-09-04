"use client";

import React, { useState, useEffect } from 'react';
import styles from '../../profile.module.css';
import { InterestSelector, LifestyleSelector, InterestSelectionItem } from '../../../../components/profile';
import apiRequest from '../../../../lib/api';

// 백엔드 기존 edit API 구조를 새 선택 컴포넌트가 요구하는 형태로 어댑트
interface InterestEditDataResponse {
  availableInterests: string[];
  selectedInterests: { interest: string; priority: number }[];
}

interface LifestyleEditDataResponse {
  workStyleOptions: string[];
  exerciseFrequencyOptions: string[];
  sleepPatternOptions: string[];
  socialActivityOptions: string[];
  currentSelections: Record<string, string>;
}

export default function ProfileEditInterestsLifestylePage() {
  const [currentTab, setCurrentTab] = useState<'interests' | 'lifestyle'>('interests');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 원본 데이터 보관 (취소 시 복원)
  const [interestRaw, setInterestRaw] = useState<InterestEditDataResponse | null>(null);
  const [lifestyleRaw, setLifestyleRaw] = useState<LifestyleEditDataResponse | null>(null);

  // 선택 상태 (새 컴포넌트 형식)
  const [interestSelections, setInterestSelections] = useState<InterestSelectionItem[]>([]); // {category - item} 파싱 필요
  const [interestCategoriesSelected, setInterestCategoriesSelected] = useState<string[]>([]);

  // 라이프스타일: 기존은 key/value 구조 -> category, item 구조로 flatten (카테고리 추정: key 앞 segment)
  const [lifestyleSelections, setLifestyleSelections] = useState<InterestSelectionItem[]>([]);
  const [lifestyleCategoriesSelected, setLifestyleCategoriesSelected] = useState<string[]>([]);

  // 데이터 로드
  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [interestRes, lifestyleRes] = await Promise.all([
        apiRequest('/profile/edit/interests'),
        apiRequest('/profile/edit/lifestyle')
      ]) as [InterestEditDataResponse, LifestyleEditDataResponse];
      setInterestRaw(interestRes);
      setLifestyleRaw(lifestyleRes);

      // 관심사: "카테고리 - 아이템" 형태 기준 분리
      const parsedInterests: InterestSelectionItem[] = interestRes.selectedInterests.map(si => {
        const [category, item] = si.interest.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setInterestSelections(parsedInterests);
      setInterestCategoriesSelected(Array.from(new Set(parsedInterests.map(p => p.category))));

      // 라이프스타일 currentSelections: key가 "카테고리 - 질문" 형태라고 가정
      const lifestylePairs: InterestSelectionItem[] = Object.keys(lifestyleRes.currentSelections || {}).filter(k => !!lifestyleRes.currentSelections[k]).map(key => {
        const [category, item] = key.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setLifestyleSelections(lifestylePairs);
      setLifestyleCategoriesSelected(Array.from(new Set(lifestylePairs.map(p => p.category))));
    } catch (e) {
      console.error('편집 데이터 로드 실패', e);
      alert('편집 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 컴포넌트는 토글 기반으로 변경 상황을 직접 반영 -> 래퍼 핸들러 제공
  const toggleInterestCategory = (category: string) => {
    setInterestCategoriesSelected(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    setHasChanges(true);
  };
  const toggleInterestItem = (category: string, item: string) => {
    setInterestSelections(prev => {
      const exists = prev.some(p => p.category === category && p.item === item);
      if (exists) return prev.filter(p => !(p.category === category && p.item === item));
      return [...prev, { category, item }];
    });
    setHasChanges(true);
  };

  const toggleLifestyleCategory = (category: string) => {
    setLifestyleCategoriesSelected(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    setHasChanges(true);
  };
  const toggleLifestyleItem = (category: string, item: string) => {
    setLifestyleSelections(prev => {
      const exists = prev.some(p => p.category === category && p.item === item);
      if (exists) return prev.filter(p => !(p.category === category && p.item === item));
      return [...prev, { category, item }];
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (currentTab === 'interests') {
        // priority는 현재 배열 순서 기준
        const interestsPayload = interestSelections.map((sel, idx) => ({
          interest: `${sel.category} - ${sel.item}`,
          priority: idx + 1,
        }));
        await apiRequest('/profile/interests', { method: 'POST', body: JSON.stringify({ interests: interestsPayload }) });
        setHasChanges(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        // lifestyle: question: `${category} - ${item}` 형태, answer는 "선택" 고정 (signup과 동일 패턴)
        const lifestyleAnswers = lifestyleSelections.map(sel => ({ question: `${sel.category} - ${sel.item}`, answer: '선택' }));
        await apiRequest('/profile/lifestyle', { method: 'PUT', body: JSON.stringify({ answers: lifestyleAnswers }) });
        setHasChanges(false);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (e) {
      console.error('저장 실패', e);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges) return;
    if (!confirm('변경사항이 있습니다. 정말 취소하시겠습니까?')) return;
    // 원본 복원
    if (interestRaw) {
      const parsed = interestRaw.selectedInterests.map(si => {
        const [category, item] = si.interest.split(' - ').map(s => s.trim());
        return { category, item } as InterestSelectionItem;
      });
      setInterestSelections(parsed);
      setInterestCategoriesSelected(Array.from(new Set(parsed.map(p => p.category))));
    }
    if (lifestyleRaw) {
      const lifestylePairs: InterestSelectionItem[] = Object.keys(lifestyleRaw.currentSelections || {}).filter(k => !!lifestyleRaw.currentSelections[k]).map(key => {
        const [category, item] = key.split(' - ').map(s => s.trim());
        return { category, item };
      });
      setLifestyleSelections(lifestylePairs);
      setLifestyleCategoriesSelected(Array.from(new Set(lifestylePairs.map(p => p.category))));
    }
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.panel}>
          <div className={styles.loadingContainer}>편집 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <header className={styles.subPageHeader}>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
            onClick={() => window.history.back()}
            style={{ flex: '0 0 auto', minWidth: 'auto', padding: '.55rem .9rem' }}
            aria-label="이전 페이지로 돌아가기"
          >
            ←
          </button>
          <h1 className={styles.subPageTitle}>프로필 편집</h1>
        </header>
        <p style={{ marginTop: '-.35rem', fontSize: '.8rem', color: 'var(--c-text-soft)' }}>관심사와 라이프스타일을 수정할 수 있습니다</p>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1.2rem', borderBottom: '1px solid var(--c-border)' }} role="tablist" aria-label="편집 범주">
          <button
            onClick={() => setCurrentTab('interests')}
            role="tab"
            aria-selected={currentTab === 'interests'}
            className={currentTab === 'interests' ? `${styles.actionBtn} ${styles.actionBtnPrimary}` : `${styles.actionBtn} ${styles.actionBtnOutline}`}
            style={{ flex: '0 0 auto', minWidth: '120px', padding: '.65rem .9rem' }}
          >
            관심사
          </button>
          <button
            onClick={() => setCurrentTab('lifestyle')}
            role="tab"
            aria-selected={currentTab === 'lifestyle'}
            className={currentTab === 'lifestyle' ? `${styles.actionBtn} ${styles.actionBtnPrimary}` : `${styles.actionBtn} ${styles.actionBtnOutline}`}
            style={{ flex: '0 0 auto', minWidth: '120px', padding: '.65rem .9rem' }}
          >
            라이프스타일
          </button>
          {hasChanges && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem', alignItems: 'center' }}>
              <button
                onClick={handleCancel}
                className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
                disabled={saving}
                style={{ padding: '.55rem .9rem' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                style={{ padding: '.55rem 1.1rem' }}
              >
                {saving ? '저장 중...' : (currentTab === 'interests' ? '관심사 저장' : '라이프스타일 저장')}
              </button>
            </div>
          )}
        </div>

        {hasChanges && (
          <div style={{ marginTop: '1rem', background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', padding: '0.9rem 1rem', borderRadius: '14px', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: '.6rem', height: '.6rem', background: 'var(--c-warn)', borderRadius: '50%', marginTop: '.25rem' }} />
            <div style={{ fontSize: '.75rem', lineHeight: 1.5, color: 'var(--c-text-soft)', flex: 1 }}>
              <strong style={{ color: 'var(--c-text)' }}>{currentTab === 'interests' ? '관심사' : '라이프스타일'}</strong>에 변경사항이 있습니다. 저장하지 않으면 변경사항이 사라집니다.
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.4rem' }}>
          {currentTab === 'interests' && (
            <InterestSelector
              selectedItems={interestSelections}
              selectedCategories={interestCategoriesSelected}
              onToggleCategory={toggleInterestCategory}
              onToggleItem={toggleInterestItem}
              onSkipToNextPhase={() => setCurrentTab('lifestyle')}
              title="관심사 수정"
              colorTheme="blue"
            />
          )}
          {currentTab === 'lifestyle' && (
            <LifestyleSelector
              selectedItems={lifestyleSelections}
              selectedCategories={lifestyleCategoriesSelected}
              onToggleCategory={toggleLifestyleCategory}
              onToggleItem={toggleLifestyleItem}
              onSkipToNextPhase={() => {}}
              title="라이프스타일 수정"
              colorTheme="orange"
            />
          )}
        </div>

        {hasChanges && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '2rem' }}>
            <button
              onClick={handleCancel}
              className={`${styles.actionBtn} ${styles.actionBtnOutline}`}
              disabled={saving}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            >
              {saving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        )}

        {showSuccessToast && (
          <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
            <div style={{ background: 'linear-gradient(90deg,#16a34a,#22c55e)', color: '#fff', padding: '.75rem 1rem', borderRadius: '14px', boxShadow: 'var(--shadow)', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span aria-hidden="true">✅</span>
              <span>{currentTab === 'interests' ? '관심사' : '라이프스타일'}가 성공적으로 저장되었습니다!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}