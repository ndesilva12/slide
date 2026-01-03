'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen, Spinner } from '@/components/ui/Spinner';
import { CommentSection } from '@/components/demands/CommentSection';
import { useAuth } from '@/contexts/AuthContext';
import { Demand, DemandCoSigner } from '@/types';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Clock,
  Building2,
  Share2,
  Check,
  UserPlus,
  Trash2,
  Calendar,
  User,
} from 'lucide-react';

export default function DemandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCoSigned, setHasCoSigned] = useState(false);
  const [coSigners, setCoSigners] = useState<DemandCoSigner[]>([]);
  const [isCoSigning, setIsCoSigning] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAllCoSigners, setShowAllCoSigners] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDemand();
    loadCoSignStatus();
  }, [id, user]);

  const loadDemand = async () => {
    try {
      const response = await fetch(`/api/demands/${id}`);
      const data = await response.json();
      if (data.success && data.data) {
        setDemand(data.data);
      } else {
        setError('Demand not found');
      }
    } catch (err) {
      setError('Failed to load demand');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCoSignStatus = async () => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (user) params.set('userId', user.uid);

      const response = await fetch(`/api/demands/${id}/cosign?${params}`);
      const data = await response.json();
      if (data.success && data.data) {
        setHasCoSigned(data.data.hasCoSigned);
        setCoSigners(data.data.coSigners);
      }
    } catch (err) {
      console.error('Failed to load co-sign status:', err);
    }
  };

  const handleCoSign = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsCoSigning(true);
    try {
      const response = await fetch(`/api/demands/${id}/cosign`, {
        method: hasCoSigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || user.email || 'Anonymous',
          userPhotoURL: user.photoURL,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setHasCoSigned(!hasCoSigned);
        // Update local count
        if (demand) {
          setDemand({
            ...demand,
            coSignCount: hasCoSigned ? demand.coSignCount - 1 : demand.coSignCount + 1,
          });
        }
        loadCoSignStatus(); // Refresh co-signers list
      }
    } catch (err) {
      console.error('Failed to co-sign:', err);
    } finally {
      setIsCoSigning(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !demand || user.uid !== demand.authorId) return;
    if (!confirm('Are you sure you want to delete this demand? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/demands/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();
      if (data.success) {
        router.push('/demands');
      }
    } catch (err) {
      console.error('Failed to delete demand:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: demand?.title,
          text: `Join this demand: ${demand?.title}`,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'Environmental':
        return 'success';
      case 'Labor Rights':
        return 'center-left';
      case 'Corporate Governance':
        return 'center';
      case 'Consumer Protection':
        return 'warning';
      case 'Social Justice':
        return 'left';
      case 'Political Transparency':
        return 'center-right';
      case 'Privacy & Data':
        return 'right';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingScreen message="Loading demand..." />
      </MainLayout>
    );
  }

  if (error || !demand) {
    return (
      <MainLayout>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">{error || 'Demand not found'}</p>
            <Button variant="ghost" onClick={() => router.push('/demands')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demands
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const isAuthor = user?.uid === demand.authorId;

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/demands')} size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            {isAuthor && (
              <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Demand Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Demand Card */}
            <Card>
              <CardContent className="p-4 md:p-6">
                {/* Category and Status */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={getCategoryVariant(demand.category) as any}>
                    {demand.category}
                  </Badge>
                  {demand.status !== 'active' && (
                    <Badge variant={demand.status === 'achieved' ? 'success' : 'default'}>
                      {demand.status === 'achieved' ? 'Achieved' : 'Closed'}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {demand.title}
                </h1>

                {/* Target Company */}
                {demand.targetCompany && (
                  <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                    <Building2 className="h-4 w-4" />
                    <span>Directed at: <strong>{demand.targetCompany}</strong></span>
                  </div>
                )}

                {/* Author and Date */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {demand.authorPhotoURL ? (
                      <img
                        src={demand.authorPhotoURL}
                        alt={demand.authorName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#741b47]/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#741b47]">
                          {demand.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {demand.authorName}
                      </p>
                      <p className="text-xs text-gray-500">Author</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(demand.createdAt)}
                  </div>
                </div>

                {/* Description */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {demand.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <CommentSection demandId={id} />
          </div>

          {/* Right Column - Co-sign and Stats */}
          <div className="space-y-4">
            {/* Co-sign Card */}
            <Card>
              <CardContent className="p-4 md:p-6">
                {/* Co-sign count */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-[#741b47] dark:text-[#d4619a]">
                    {demand.coSignCount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {demand.coSignCount === 1 ? 'person has' : 'people have'} co-signed
                  </p>
                </div>

                {/* Co-sign Button */}
                <Button
                  variant={hasCoSigned ? 'ghost' : 'primary'}
                  className="w-full mb-4"
                  onClick={handleCoSign}
                  disabled={isCoSigning || isAuthor}
                >
                  {isCoSigning ? (
                    <Spinner size="sm" />
                  ) : hasCoSigned ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Co-signed
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Co-sign this Demand
                    </>
                  )}
                </Button>

                {isAuthor && (
                  <p className="text-xs text-center text-gray-400 mb-4">
                    You created this demand
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 py-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 text-[#741b47]" />
                    <span>{demand.coSignCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-4 w-4" />
                    <span>{demand.commentCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Co-signers */}
            {coSigners.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Recent Co-signers
                  </h3>
                  <div className="space-y-2">
                    {(showAllCoSigners ? coSigners : coSigners.slice(0, 5)).map((signer) => (
                      <div key={signer.id} className="flex items-center gap-2">
                        {signer.userPhotoURL ? (
                          <img
                            src={signer.userPhotoURL}
                            alt={signer.userName}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#741b47]/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-[#741b47]">
                              {signer.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {signer.userName}
                        </span>
                      </div>
                    ))}
                  </div>
                  {coSigners.length > 5 && (
                    <button
                      onClick={() => setShowAllCoSigners(!showAllCoSigners)}
                      className="text-xs text-[#741b47] dark:text-[#d4619a] hover:underline mt-2"
                    >
                      {showAllCoSigners ? 'Show less' : `+ ${coSigners.length - 5} more`}
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Share this Demand
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Help this demand gain more support by sharing it.
                </p>
                <Button variant="ghost" size="sm" className="w-full" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-sm">
              <CardContent className="p-6 text-center">
                <UserPlus className="h-10 w-10 text-[#741b47] mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sign in to Co-sign
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  You need an account to co-sign and support this demand.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowLoginPrompt(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/login')}
                    className="flex-1"
                  >
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
