import React, { useState } from 'react';
import api from '../services/api';

function CommentSection({ diaryId, comments: initialComments, currentUser }) {
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [error, setError] = useState(null);  // 에러 상태 추가

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError(null);  // 에러 초기화
    try {
      const response = await api.post(`/api/entries/${diaryId}/comments`, {
        content: newComment
      });
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      setError('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    setError(null);  // 에러 초기화
    try {
      await api.delete(`/api/entries/${diaryId}/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      setError('댓글 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="mt-4">
      {error && (  // 에러 메시지 표시
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded-lg mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={comment.author.profileImage || '/default-avatar.png'} 
                  alt={comment.author.username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium text-sm">{comment.author.username}</span>
              </div>
              {currentUser && currentUser.id === comment.author.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingCommentId === comment.id}
                  className="text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
                >
                  {deletingCommentId === comment.id ? '삭제 중...' : '삭제'}
                </button>
              )}
            </div>
            <p className="text-gray-700 mt-1">{comment.content}</p>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}  // 빈 댓글 제출 방지
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '게시 중...' : '게시'}
        </button>
      </form>
    </div>
  );
}

export default CommentSection;