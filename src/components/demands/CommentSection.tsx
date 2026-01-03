'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { DemandComment } from '@/types';
import { MessageSquare, Send, Trash2, Clock, ArrowUp, ArrowDown, User } from 'lucide-react';

interface CommentSectionProps {
  demandId: string;
}

export function CommentSection({ demandId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<DemandComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'popular'>('recent');
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [demandId, sortBy]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/demands/${demandId}/comments?sortBy=${sortBy}`);
      const data = await response.json();
      if (data.success && data.data?.comments) {
        setComments(data.data.comments);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/demands/${demandId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: user.uid,
          authorName: user.displayName || user.email || 'Anonymous',
          authorPhotoURL: user.photoURL,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewComment('');
        loadComments(); // Refresh comments
      } else {
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/demands/${demandId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          userId: user.uid,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#741b47]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Discussion
            </h2>
            <span className="text-sm text-gray-500">({comments.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={sortBy === 'recent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('recent')}
              className="text-xs px-2"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              New
            </Button>
            <Button
              variant={sortBy === 'oldest' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('oldest')}
              className="text-xs px-2"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Old
            </Button>
          </div>
        </div>

        {/* Comment Input */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#741b47]/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-[#741b47]" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#741b47]/50 resize-none"
                  maxLength={2000}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{newComment.length}/2000</span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <a href="/login" className="text-[#741b47] dark:text-[#d4619a] font-medium hover:underline">
                Sign in
              </a>{' '}
              to join the discussion
            </p>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  {comment.authorPhotoURL ? (
                    <img
                      src={comment.authorPhotoURL}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#741b47]/20 flex items-center justify-center">
                      <span className="text-xs font-medium text-[#741b47]">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.authorName}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(comment.createdAt)}
                    </span>
                    {user?.uid === comment.authorId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
