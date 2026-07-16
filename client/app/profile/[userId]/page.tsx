'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import type { PublicUserProfile, PYQPaper } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  UserPlus, 
  GraduationCap, 
  Mail, 
  FileText, 
  Download, 
  ArrowLeft,
  Calendar,
  Eye,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  // Self profile check
  useEffect(() => {
    if (currentUser && currentUser.id === userId) {
      router.replace('/profile');
    }
  }, [currentUser, userId, router]);

  // Fetch user profile data
  useEffect(() => {
    if (!currentUser || currentUser.id === userId) return;

    const fetchProfile = async () => {
      try {
        const res = await userApi.getProfile(userId);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.message || 'Failed to load profile');
        }
      } catch (err: unknown) {
        setError('Error retrieving user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, userId]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    setFollowLoading(true);
    setError('');

    try {
      if (profile.isFollowing) {
        const res = await userApi.unfollow(userId);
        if (res.success) {
          setProfile((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              isFollowing: false,
              user: {
                ...prev.user,
                followersCount: prev.user.followersCount - 1,
              },
            };
          });
        }
      } else {
        const res = await userApi.follow(userId);
        if (res.success) {
          setProfile((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              isFollowing: true,
              user: {
                ...prev.user,
                followersCount: prev.user.followersCount + 1,
              },
            };
          });
        }
      }
    } catch (err: unknown) {
      setError('Failed to perform follow action. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[80vh] py-12 px-4 max-w-xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.push('/pyq')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to PYQs
        </Button>
        <Alert variant="destructive" className="shadow-lg border-red-200">
          <AlertDescription className="font-semibold">{error || 'User profile not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getSessionName = (paper: PYQPaper) => {
    if (typeof paper.sessionId === 'string') return 'N/A';
    return (paper.sessionId as any).name || 'N/A';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back button */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Profile Card Header */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-md">
          <CardContent className="pt-8 pb-8 px-6 sm:px-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              
              {/* Avatar */}
              <Avatar className="h-28 w-28 ring-4 ring-indigo-500/10 shadow-xl flex-shrink-0">
                {profile.user.picture ? (
                  <AvatarImage src={profile.user.picture} alt={profile.user.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-3xl font-bold">
                  {getInitials(profile.user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Middle Section: Stats & Details */}
              <div className="flex-grow space-y-4 text-center md:text-left">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                    {profile.user.name}
                  </h1>
                  <p className="text-gray-500 font-semibold capitalize text-sm mt-1">{profile.user.role}</p>
                </div>

                {/* Followers and Following Stats */}
                <div className="flex justify-center md:justify-start gap-8 py-2">
                  <div className="text-center md:text-left">
                    <p className="text-2xl font-black text-gray-800">{profile.user.followersCount}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Followers</p>
                  </div>
                  <div className="border-r border-gray-200" />
                  <div className="text-center md:text-left">
                    <p className="text-2xl font-black text-gray-800">{profile.user.followingCount}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Following</p>
                  </div>
                </div>

                {/* Course & Email */}
                <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-gray-700">{profile.user.course}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{profile.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              <div className="flex-shrink-0 w-full md:w-auto self-center md:self-start">
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`w-full md:w-36 h-11 font-bold shadow-md transition-all ${
                    profile.isFollowing 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200' 
                      : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white'
                  }`}
                >
                  {followLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : profile.isFollowing ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      Following
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </span>
                  )}
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Last Uploaded Papers section */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Uploaded Papers
            </CardTitle>
            <CardDescription>Verified papers contributed by {profile.user.name}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {profile.lastPapers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Info className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium">No verified papers uploaded yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.lastPapers.map((paper) => (
                  <Card key={paper._id} className="border border-gray-100 bg-white/50 hover:bg-white hover:shadow-md transition-all">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-gray-800 leading-tight truncate flex-1" title={paper.title}>
                          {paper.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 uppercase border border-indigo-100">
                          {paper.examType}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Semester</p>
                          <p className="font-medium">Semester {paper.semester}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">Session</p>
                          <p className="font-medium">{getSessionName(paper)}</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
                        <div className="flex gap-3 text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />
                            {paper.downloads || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {paper.views || 0}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => router.push(`/view/${paper._id}?type=pyq`)}
                          className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
                        >
                          <span className="flex items-center gap-1">
                            View File
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
