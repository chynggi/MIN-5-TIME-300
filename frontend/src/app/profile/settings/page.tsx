'use client';

import React, { useState, useEffect } from 'react';
// profile.module.css 제거: 전역 global-ui.css 유틸 클래스로 대체
import { privacyApi } from '../../../services/privacy-api';
import { notificationApi } from '../../../services/notification-api';
import { VisibilityLevel } from '../../../types/privacy-settings.dto';

/**
 * Settings Page Sections:
 * - privacy: 공개/팔로워 목록 범위 등 (기존 privacy 페이지 대체)
 * - blocked: 차단 사용자 관리
 * - activity: 활동지수 노출/리셋 관련
 * - account: 계정 (로그아웃 등)
 */

type TabKey = 'privacy' | 'blocked' | 'activity' | 'account';

interface BlockedUser {
  id: string;
  username: string;
  mbti?: string;
}

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Privacy state (migrated)
  const [followVisibility, setFollowVisibility] = useState<{followers: VisibilityLevel; following: VisibilityLevel}>({ followers: 'PUBLIC', following: 'PUBLIC' });
  const [allowDM, setAllowDM] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  // Activity settings
  const [activityPublic, setActivityPublic] = useState(true);
  const [activityLastResetAt, setActivityLastResetAt] = useState<string | undefined>(undefined);
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityResetPending, setActivityResetPending] = useState(false);

  useEffect(() => { loadInitial(); }, []);

  const loadInitial = async () => {
    try {
      setLoading(true);
      // Load privacy settings - try/catch because backend may not have all endpoints yet
      try {
        const privacy = await privacyApi.getDetailedPrivacySettings();
        setFollowVisibility({ followers: privacy.followersVisibility, following: privacy.followingVisibility });
        setShowOnline(privacy.showOnlineStatus);
        setAllowDM(privacy.allowDirectMessages);
      } catch (e) {
        console.log('상세 개인정보 설정 로드 실패(스텁일 수 있음)', e);
      }
      // Load notification toggles (for DM fallback)
      try {
        const notif = await notificationApi.getSettings();
        setAllowDM(notif.messageNotification);
      } catch {}
      // Blocked users
      try {
        setBlockedLoading(true);
        const res = await privacyApi.getBlockedUsers();
        setBlockedUsers(res.blockedUsers.map(u => ({ id: u.id, username: u.username })));
      } catch (e) {
        console.log('차단 사용자 목록 로드 실패', e);
        setBlockedUsers([]);
      } finally { setBlockedLoading(false); }

      // Activity settings (새 API)
      try {
        const act = await privacyApi.getActivitySettings();
        setActivityPublic(act.activityPublic);
        setActivityLastResetAt(act.lastResetAt);
      } catch (e) {
        console.log('활동지수 설정 로드 실패(아직 백엔드 미배포 가능)', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await notificationApi.updateSettings({ messageNotification: allowDM });
      try {
        await privacyApi.updateDetailedPrivacySettings({
          followersVisibility: followVisibility.followers,
          followingVisibility: followVisibility.following,
          showOnlineStatus: showOnline,
          allowDirectMessages: allowDM,
        });
      } catch (e) { console.log('상세 개인정보 업데이트 실패(스텁 가능)', e); }
      alert('개인정보 설정이 저장되었습니다.');
    } catch (e) {
      console.error(e);
      alert('저장 실패');
    }
    setSaving(false);
  };

  const handleUnblock = async (userId: string) => {
    if (!confirm('차단을 해제하시겠습니까?')) return;
    try {
      await privacyApi.unblockUser(userId);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      alert('해제 실패: 나중에 다시 시도해주세요.');
    }
  };

  const handleSaveActivityPublic = async () => {
    setActivitySaving(true);
    try {
      await privacyApi.updateActivitySettings({ activityPublic });
      alert('활동지수 공개 설정이 저장되었습니다.');
    } catch (e) {
      alert('저장 실패: ' + (e as any)?.message);
    } finally {
      setActivitySaving(false);
    }
  };

  const handleResetActivity = async () => {
    if (!confirm('활동지수 데이터를 초기화하시겠습니까? (되돌릴 수 없음)')) return;
    setActivityResetPending(true);
    try {
      const res = await privacyApi.resetActivity();
      setActivityLastResetAt(res.resetAt);
      alert('활동지수가 초기화되었습니다.');
    } catch (e) {
      alert('초기화 실패: 나중에 다시 시도해주세요.');
    } finally {
      setActivityResetPending(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try {
      // 백엔드 호출이 있다면 추가 (예: /auth/logout)
      // 토큰 키 통일: 일부 서비스는 'token'을 사용
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      location.href = '/login';
    } catch (e) {
      console.error('로그아웃 실패', e);
    }
  };

  const renderToggle = (label: string, checked: boolean, onChange: () => void, desc?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', padding: '.9rem 1rem', border: '1px solid var(--c-border)', borderRadius: '14px', background: 'var(--c-bg-soft)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--c-text)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.7rem', color: 'var(--c-text-soft)', marginTop: '.25rem' }}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={onChange}
        aria-pressed={checked}
        className={`btn ${checked ? 'btn-primary' : 'btn-outline'}`}
        style={{ flex: '0 0 auto', minWidth: '92px', padding: '.55rem .9rem' }}
      >
        {checked ? 'ON' : 'OFF'}
      </button>
    </div>
  );

  const tabBtn = (key: TabKey, label: string) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      role="tab"
      aria-selected={activeTab === key}
      className={`btn ${activeTab === key ? 'btn-primary' : 'btn-outline'}`}
      style={{ flex: '0 0 auto', minWidth: '120px', padding: '.65rem .9rem' }}
    >
      {label}
    </button>
  );

  return (
    <div className="ui-container">
      <div className="ui-panel">
        <header className="ui-subHeader">
          <button
            className={`btn btn-outline`}
            onClick={() => history.back()}
            style={{ flex: '0 0 auto', minWidth: 'auto', padding: '.55rem .9rem' }}
            aria-label="이전 페이지로 돌아가기"
          >
            ←
          </button>
          <h1 className="ui-subHeaderTitle">설정</h1>
        </header>
        <p style={{ marginTop: '-.35rem', fontSize: '.8rem', color: 'var(--c-text-soft)' }}>프로필 및 계정 관련 설정을 관리합니다</p>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.2rem', borderBottom: '1px solid var(--c-border)', paddingBottom: '.75rem' }} role="tablist" aria-label="설정 범주">
          {tabBtn('privacy','개인정보')}
          {tabBtn('blocked','차단')}
            {tabBtn('activity','활동지수')}
          {tabBtn('account','계정')}
        </div>

        {loading && <div style={{ marginTop: '1rem', fontSize: '.75rem', color: 'var(--c-text-soft)' }}>로드 중...</div>}

        {/* 콘텐츠 */}
        {!loading && (
          <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {activeTab === 'privacy' && (
              <>
                <h2 style={{ fontSize: '.85rem', fontWeight: 700, letterSpacing: '.5px', color: 'var(--c-text)' }}>프로필 공개 / 팔로우</h2>
                <div style={{ display: 'grid', gap: '.9rem' }}>
                  {renderToggle('DM 수신 허용', allowDM, () => setAllowDM(p=>!p), '다른 사용자가 메시지를 보낼 수 있습니다')}
                  {renderToggle('온라인 상태 표시', showOnline, () => setShowOnline(p=>!p), '내 접속 상태를 다른 사용자에게 노출')}
                </div>
                <div style={{ display: 'grid', gap: '.9rem', marginTop: '.5rem' }}>
                  <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--c-text-soft)', textTransform: 'uppercase', letterSpacing: '.5px' }}>팔로우 목록 공개범위</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--c-text-soft)', display:'block', marginBottom: '.35rem' }}>Followers</label>
                        <select
                          value={followVisibility.followers}
                          onChange={(e)=>setFollowVisibility(v=>({...v, followers: e.target.value as VisibilityLevel}))}
                          style={{ width: '100%', padding: '.65rem .75rem', border: '1px solid var(--c-border)', borderRadius: '12px', background: 'var(--c-bg-soft)', fontSize: '.75rem' }}
                        >
                          <option value="PUBLIC">공개</option>
                          <option value="FRIENDS">팔로워만</option>
                          <option value="PRIVATE">비공개</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--c-text-soft)', display:'block', marginBottom: '.35rem' }}>Following</label>
                        <select
                          value={followVisibility.following}
                          onChange={(e)=>setFollowVisibility(v=>({...v, following: e.target.value as VisibilityLevel}))}
                          style={{ width: '100%', padding: '.65rem .75rem', border: '1px solid var(--c-border)', borderRadius: '12px', background: 'var(--c-bg-soft)', fontSize: '.75rem' }}
                        >
                          <option value="PUBLIC">공개</option>
                          <option value="FRIENDS">팔로워만</option>
                          <option value="PRIVATE">비공개</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
                  <button
                    type="button"
                    className={`btn btn-primary`}
                    disabled={saving}
                    onClick={handleSavePrivacy}
                    style={{ flex: '1 1 auto' }}
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </>
            )}

            {activeTab === 'blocked' && (
              <>
                <h2 style={{ fontSize: '.85rem', fontWeight: 700, letterSpacing: '.5px', color: 'var(--c-text)' }}>차단 사용자</h2>
                {blockedLoading && <div style={{ fontSize: '.7rem', color: 'var(--c-text-soft)' }}>로드 중...</div>}
                {!blockedLoading && blockedUsers.length === 0 && (
                  <div style={{ fontSize: '.7rem', color: 'var(--c-text-soft)', background:'var(--c-bg-soft)', border:'1px solid var(--c-border)', padding: '.9rem 1rem', borderRadius: '14px' }}>차단한 사용자가 없습니다.</div>
                )}
                <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'.6rem' }}>
                  {blockedUsers.map(user => (
                    <li key={user.id} style={{ display:'flex', alignItems:'center', gap:'.9rem', padding:'.75rem .9rem', border:'1px solid var(--c-border)', borderRadius:'14px', background:'var(--c-bg-soft)' }}>
                      <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'var(--c-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:600, color:'var(--c-text-soft)' }}>{user.username.slice(0,2).toUpperCase()}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'.8rem', fontWeight:600 }}>{user.username}</div>
                        {user.mbti && <div style={{ fontSize:'.6rem', color:'var(--c-text-soft)', marginTop:'.15rem' }}>{user.mbti}</div>}
                      </div>
                      <button
                        type="button"
                        className={`btn btn-outline`}
                        onClick={()=>handleUnblock(user.id)}
                        style={{ flex:'0 0 auto', minWidth:'auto', padding:'.55rem .85rem' }}
                      >
                        해제
                      </button>
                    </li>
                  ))}
                </ul>
                {blockedUsers.length > 0 && (
                  <div style={{ fontSize: '.6rem', color: 'var(--c-text-soft)', marginTop: '.5rem' }}>총 {blockedUsers.length}명 차단됨</div>
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <>
                <h2 style={{ fontSize: '.85rem', fontWeight: 700, letterSpacing: '.5px', color: 'var(--c-text)' }}>활동지수 설정</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                  {renderToggle('활동지수 공개', activityPublic, ()=>setActivityPublic(p=>!p), '다른 사용자에게 활동지수 카드 표시')}
                  <div style={{ display:'flex', gap:'.6rem' }}>
                    <button type="button" className={`btn btn-primary`} disabled={activitySaving} onClick={handleSaveActivityPublic} style={{ flex:'0 0 auto', minWidth:'120px', padding:'.55rem .9rem' }}>
                      {activitySaving ? '저장 중...' : '공개 설정 저장'}
                    </button>
                  </div>
                  <div style={{ border:'1px solid var(--c-border)', background:'var(--c-bg-soft)', padding:'.9rem 1rem', borderRadius:'14px', fontSize:'.7rem', lineHeight:1.5 }}>
                    활동지수는 최근 활동(일기 작성, 팔로우, 상호작용 등)을 기반으로 산출됩니다. <br/>초기화 시 즉시 0%로 떨어지며 다시 지표가 쌓이는 데 시간이 필요합니다.
                    <div style={{ display:'flex', gap:'.6rem', marginTop:'.75rem' }}>
                      <button
                        type="button"
                        className={`btn btn-outline`}
                        onClick={handleResetActivity}
                        disabled={activityResetPending}
                        style={{ flex:'0 0 auto', minWidth:'140px', padding:'.55rem .9rem' }}
                      >
                        {activityResetPending ? '초기화 중...' : '활동지수 초기화'}
                      </button>
                    </div>
                    {activityLastResetAt && (
                      <div style={{ fontSize:'.55rem', color:'var(--c-text-soft)', marginTop:'.55rem' }}>마지막 초기화: {new Date(activityLastResetAt).toLocaleString()}</div>
                    )}
                  </div>
                  <div style={{ fontSize: '.6rem', color: 'var(--c-text-soft)' }}>활동지수 데이터는 주기적으로 재계산됩니다.</div>
                </div>
              </>
            )}

            {activeTab === 'account' && (
              <>
                <h2 style={{ fontSize: '.85rem', fontWeight: 700, letterSpacing: '.5px', color: 'var(--c-text)' }}>계정</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'.9rem' }}>
                  <div style={{ border:'1px solid var(--c-border)', background:'var(--c-bg-soft)', padding:'.95rem 1.05rem', borderRadius:'14px', fontSize:'.7rem', lineHeight:1.55 }}>
                    <strong style={{ fontSize:'.75rem' }}>로그아웃</strong><br/>
                    현재 기기에서 로그아웃합니다. 다시 로그인하려면 이메일/비밀번호가 필요합니다.
                    <div style={{ marginTop: '.7rem', display:'flex', gap:'.6rem' }}>
                      <button
                        type="button"
                        className={`btn btn-outline`}
                        onClick={handleLogout}
                        style={{ minWidth:'140px', padding:'.6rem .9rem' }}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '.6rem', color: 'var(--c-text-soft)' }}>* 회원탈퇴 기능은 추후 추가 예정.</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
