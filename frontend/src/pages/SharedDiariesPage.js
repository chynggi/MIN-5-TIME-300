import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CommentSection from '../components/CommentSection';

function SharedDiariesPage() {
  const [sharedEntries, setSharedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchSharedEntries = useCallback(async () => {
    setLoading(true);
    try {
      console.log('API 호출 시작:', `/api/shared-entries?page=${page}`);  // 디버깅 로그 추가
      const response = await api.get(`/api/shared-entries?page=${page}`);
      console.log('API 응답:', response);  // 디버깅 로그 추가
      
      if (!response.data) {
        throw new Error('데이터가 없습니다.');
      }
      
      setSharedEntries(prev => 
        page === 1 ? response.data : [...prev, ...response.data]
      );
      setHasMore(response.data.length === 10);
    } catch (error) {
      console.error("Error fetching shared entries:", error.response || error);  // 에러 상세 정보 추가
      setError("일기 목록을 불러오는데 실패했습니다. " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSharedEntries();
  }, [fetchSharedEntries]);

  const handleLike = async (entryId) => {
    try {
      const response = await api.post(`/api/entries/${entryId}/like`);
      setSharedEntries(entries =>
        entries.map(entry =>
          entry.id === entryId
            ? { ...entry, likes: response.data.likes, isLiked: response.data.isLiked }
            : entry
        )
      );
    } catch (error) {
      console.error("Error liking entry:", error);
      // 사용자에게 에러 피드백 제공
      alert("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 무한 스크롤 구현을 위한 IntersectionObserver 설정
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.5 }
    );

    const target = document.getElementById('load-more');
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loading]);

  if (loading && page === 1) {
    return <div className="text-center py-8">일기를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!loading && sharedEntries.length === 0) {
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

  return (
    <div className="max-w-3xl mx-auto p-4">
      {sharedEntries.map(entry => (
        <div key={entry.id} className="bg-white rounded-lg shadow-md mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={entry.author.profileImage || '/default-avatar.png'}
              alt={entry.author.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">{entry.author.username}</h3>
              <span className="text-sm text-gray-500">
                {new Date(entry.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <p className="text-lg mb-4">{entry.content}</p>

          {entry.image && (
            <img
              src={entry.image}
              alt="일기 이미지"
              className="w-full rounded-lg mb-4"
            />
          )}

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => handleLike(entry.id)}
              className={`flex items-center gap-2 ${
                entry.isLiked ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>{entry.likes || 0}</span>
            </button>
          </div>

          <CommentSection diaryId={entry.id} comments={entry.comments} />
        </div>
      ))}

      {hasMore && (
        <div 
          id="load-more" 
          className="w-full py-3 text-center text-gray-500"
        >
          {loading ? '로딩 중...' : '스크롤하여 더 보기'}
        </div>
      )}
    </div>
  );
}

export default SharedDiariesPage;