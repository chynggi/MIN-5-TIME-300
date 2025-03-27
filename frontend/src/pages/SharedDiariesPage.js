import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CommentSection from '../components/CommentSection';

// 로딩 표시기 컴포넌트
const LoadingIndicator = () => (
  <div className="flex justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// 에러 메시지 컴포넌트
const ErrorMessage = ({ message, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex justify-between">
    <span>{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-700">
        ✕
      </button>
    )}
  </div>
);

// 일기 항목 컴포넌트
const DiaryEntry = memo(({ entry, onLike, onCommentsUpdate }) => {
  // 사용자 프로필 정보 포맷팅
  const author = {
    username: entry.username || 'Unknown',
    profileImage: entry.profile_image || '/default-avatar.png'
  };

  // 날짜 포맷팅
  const formattedDate = new Date(entry.created_at).toLocaleDateString();
  
  // 좋아요 처리 중 상태 추가
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  
  // 좋아요 핸들러 - 디바운싱 추가
  const handleLike = () => {
    if (isLikeProcessing) return;
    setIsLikeProcessing(true);
    onLike(entry.id);
    setTimeout(() => setIsLikeProcessing(false), 500); // 500ms 디바운싱
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-6 p-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={author.profileImage}
          alt={author.username}
          className="w-10 h-10 rounded-full"
          onError={(e) => { e.target.src = '/default-avatar.png' }}
        />
        <div>
          <h3 className="font-medium">{author.username}</h3>
          <span className="text-sm text-gray-500">{formattedDate}</span>
        </div>
      </div>

      <p className="text-lg whitespace-pre-wrap mb-4">{entry.content}</p>

      {/* 평점 표시 추가 */}
      {entry.rating && (
        <div className="flex items-center mb-4">
          <span className="text-gray-700 mr-2">기분 평점:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star} 
                className={`w-5 h-5 ${star <= entry.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          disabled={isLikeProcessing}
          className={`flex items-center gap-2 transition-colors ${
            entry.is_liked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
          } ${isLikeProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span>{entry.likes || 0}</span>
        </button>
        
        {/* 댓글 수 표시 추가 */}
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span>{entry.comment_count || 0}</span>
        </div>
      </div>

      <CommentSection 
        diaryId={entry.id} 
        comments={entry.comments || []}
        commentCount={entry.comment_count || 0}
        onCommentsUpdate={(newComments) => onCommentsUpdate(entry.id, newComments)}
      />
    </div>
  );
});

function SharedDiariesPage() {
  const [sharedEntries, setSharedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(null); // 페이지 번호 대신 커서 사용
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const pendingLikes = useRef(new Set()); // 좋아요 처리 중인 항목 추적
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 로그인 상태 추적을 위한 state 추가

  const fetchSharedEntries = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    
    try {
      // 토큰 확인
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false); // 로그인 상태 업데이트
        setLoading(false);
        loadingRef.current = false;
        return; // 토큰이 없으면 API 호출을 중단
      }
      
      // 커서 기반 페이지네이션 적용
      const endpoint = cursor 
        ? `/api/shared-entries?cursor=${cursor}&limit=10` 
        : `/api/shared-entries?limit=10`;
        
      const response = await api.get(endpoint);
      
      if (!response.data || !response.data.entries) {
        throw new Error('데이터가 없습니다.');
      }
      
      const { entries, nextCursor } = response.data;

      // 백엔드 응답 데이터를 프론트엔드 형식에 맞게 변환
      const formattedEntries = entries.map(entry => ({
        id: entry.id,
        content: entry.content,
        rating: entry.rating,
        created_at: entry.created_at,
        username: entry.username,
        profile_image: entry.profile_image,
        likes: parseInt(entry.likes) || 0,
        is_liked: entry.is_liked || false,
        comment_count: parseInt(entry.comment_count) || 0,
        comments: [] // 댓글은 초기에 빈 배열로 설정 (지연 로딩)
      }));

      setSharedEntries(prev => 
        cursor ? [...prev, ...formattedEntries] : formattedEntries
      );
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
      setRetryCount(0);
      setError(null);
    } catch (error) {
      console.error("Error fetching shared entries:", error.response || error);
      
      // 인증 오류 처리
      if (error.response?.status === 401 || error.response?.status === 403) {
        setIsLoggedIn(false); // 인증 오류 시 로그인 상태 업데이트
      } else {
        setError("일기 목록을 불러오는데 실패했습니다. " + (error.response?.data?.message || error.message));
      }
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 2000);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [cursor, retryCount]);

  useEffect(() => {
    // 토큰 유효성 확인
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false); // 로그인 상태 업데이트
      setLoading(false);
      return;
    }
    
    fetchSharedEntries();
  }, []); // 컴포넌트 마운트 시 실행

  // 별도의 재시도 이펙트
  useEffect(() => {
    let retryTimer = null;
    
    if (error && retryCount < maxRetries) {
      retryTimer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchSharedEntries();
      }, 2000);
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [error, retryCount, maxRetries]); // fetchSharedEntries 의존성 제거

  // 좋아요 처리 최적화 함수
  const handleLike = async (entryId) => {
    if (pendingLikes.current.has(entryId)) return; // 이미 처리 중인 좋아요 요청 방지
    
    pendingLikes.current.add(entryId);
    const entryIndex = sharedEntries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
      pendingLikes.current.delete(entryId);
      return;
    }
    
    const entry = sharedEntries[entryIndex];
    const wasLiked = entry.is_liked;
    
    // 낙관적 업데이트
    setSharedEntries(entries =>
      entries.map(e =>
        e.id === entryId
          ? { 
              ...e, 
              likes: wasLiked ? (e.likes - 1) : (e.likes + 1), 
              is_liked: !wasLiked 
            }
          : e
      )
    );
    
    try {
      const response = await api.post(`/api/entries/${entryId}/like`);
      
      // 백엔드 응답 구조와 필드명에 맞게 수정
      setSharedEntries(entries =>
        entries.map(e =>
          e.id === entryId
            ? { ...e, likes: response.data.likes, is_liked: response.data.isLiked }
            : e
        )
      );
    } catch (error) {
      console.error("Error liking entry:", error);
      
      // 롤백
      setSharedEntries(entries =>
        entries.map(e =>
          e.id === entryId
            ? { ...e, likes: entry.likes, is_liked: wasLiked }
            : e
        )
      );
      
      setError("좋아요 처리 중 오류가 발생했습니다.");
      setTimeout(() => setError(null), 3000);
    } finally {
      pendingLikes.current.delete(entryId);
    }
  };

  // 댓글 로딩 함수 추가
  const loadComments = useCallback(async (diaryId) => {
    try {
      const response = await api.get(`/api/entries/${diaryId}/comments`);
      if (!response.data) return [];
      
      // 댓글 데이터 업데이트
      setSharedEntries(entries =>
        entries.map(e =>
          e.id === diaryId
            ? { ...e, comments: response.data }
            : e
        )
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error loading comments for diary ${diaryId}:`, error);
      return [];
    }
  }, []);

  const updateComments = useCallback((diaryId, newComments) => {
    setSharedEntries(entries =>
      entries.map(entry =>
        entry.id === diaryId
          ? { 
              ...entry, 
              comments: newComments,
              comment_count: newComments.length 
            }
          : entry
      )
    );
  }, []);

  // 무한 스크롤 개선 (Intersection Observer)
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          fetchSharedEntries();
        }
      },
      { threshold: 0.5, rootMargin: '0px 0px 200px 0px' }
    );

    const target = document.getElementById('load-more');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading, fetchSharedEntries]);

  // 비로그인 상태일 때 표시할 컴포넌트
  const renderNotLoggedInView = () => (
    <div className="max-w-lg mx-auto p-6 mt-8">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h3 className="text-xl font-semibold mb-2">로그인이 필요합니다</h3>
        <p className="text-gray-600 mb-6">
          다른 사용자들의 일기를 보려면 로그인해 주세요.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );

  // 로딩 중이고 항목이 없는 경우
  if (loading && sharedEntries.length === 0) {
    return <div className="text-center py-8">일기를 불러오는 중...</div>;
  }

  // 비로그인 상태일 때
  if (!isLoggedIn) {
    return renderNotLoggedInView();
  }

  // 로그인 상태지만 항목이 없는 경우
  if (!loading && sharedEntries.length === 0 && !error) {
    return (
      <div className="max-w-lg mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2">아직 공유된 일기가 없어요</h3>
          <p className="text-gray-600 mb-6">
            첫 번째 일기를 작성하고 다른 사람들과 공유해보세요!
          </p>
          <Link
            to="/write"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            일기 작성하기
          </Link>
        </div>
      </div>
    );
  }

  // 기존의 일기 목록 표시
  return (
    <div className="max-w-3xl mx-auto p-4">
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      
      <div className="mb-6 sticky top-0 bg-gray-50 p-4 rounded-lg shadow-sm z-10">
        <Link
          to="/write"
          className="inline-block w-full px-6 py-3 bg-blue-500 text-white text-center rounded-lg hover:bg-blue-600 transition-colors"
        >
          새 일기 작성하기
        </Link>
      </div>

      {sharedEntries.map(entry => (
        <DiaryEntry 
          key={entry.id} 
          entry={entry} 
          onLike={handleLike}
          onCommentsUpdate={updateComments}
        />
      ))}

      {loading && sharedEntries.length > 0 && <LoadingIndicator />}

      {hasMore && (
        <div 
          id="load-more" 
          className="w-full py-3 text-center text-gray-500"
        >
          {loading ? '로딩 중...' : '스크롤하여 더 보기'}
        </div>
      )}
      
      {!hasMore && sharedEntries.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          더 이상 표시할 일기가 없습니다.
        </div>
      )}
    </div>
  );
}

export default SharedDiariesPage;