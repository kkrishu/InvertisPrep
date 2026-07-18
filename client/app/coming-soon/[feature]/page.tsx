'use client';

import { use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket, Sparkles } from 'lucide-react';

// Feature catalog — each new "coming soon" feature gets its own entry
const FEATURES: Record<string, { title: string; tagline: string; description: string; features: string[]; icon: string }> = {
  'ats-score': {
    title: 'ATS Score Checker',
    tagline: 'Beat the resume robots',
    description:
      'Upload your resume and get an instant Applicant Tracking System (ATS) compatibility score. See exactly what keywords, formatting, and sections are hurting your chances before a human ever sees it.',
    features: [
      'Instant ATS compatibility score (0-100)',
      'Keyword match analysis against job descriptions',
      'Formatting & parsing checks',
      'Actionable, line-by-line suggestions',
    ],
    icon: '🎯',
  },
  'resume-builder': {
    title: 'Resume Builder',
    tagline: 'A resume that gets you interviews',
    description:
      'Build a clean, recruiter-ready resume with professionally designed templates optimized for ATS. Fill in once, export to multiple polished formats, and tweak per role in minutes.',
    features: [
      'ATS-friendly templates',
      'One-click PDF export',
      'Per-role resume variants',
      'Live preview as you type',
    ],
    icon: '📄',
  },
  'societies': {
    title: 'Societies & Clubs',
    tagline: 'Find your people on campus',
    description:
      'Browse every club, society, and student body at Invertis University. See what they do, who runs them, when they meet, and how to join — all in one place.',
    features: [
      'Directory of all campus societies',
      'Upcoming society events & recruitments',
      'Contact the team directly',
      'Follow societies you care about',
    ],
    icon: '🤝',
  },
  'career': {
    title: 'Career Hub',
    tagline: 'Your next opportunity starts here',
    description:
      'Internships, full-time roles, hackathons, and workshops curated for Invertis students. Track deadlines, save opportunities, and apply directly.',
    features: [
      'Curated internships & jobs',
      'Hackathon & workshop listings',
      'Deadline reminders',
      'Application tracking',
    ],
    icon: '💼',
  },
  'events': {
    title: 'Campus Events',
    tagline: 'Never miss what\'s happening',
    description:
      'A unified calendar of every event at Invertis University — fests, talks, workshops, sports, and society activities. RSVP, add to your calendar, and get reminders.',
    features: [
      'Unified campus event calendar',
      'RSVP & reminders',
      'Filter by category & date',
      'Add to Google Calendar',
    ],
    icon: '🎉',
  },
  'leaderboard': {
    title: 'Leaderboard',
    tagline: 'Climb the ranks',
    description:
      'See where you stand among Invertis students. Earn points for uploads, contributions, quiz performance, and community activity.',
    features: [
      'Global & department rankings',
      'Points for contributions',
      'Weekly & all-time boards',
      'Badges & milestones',
    ],
    icon: '🏆',
  },
};

export default function ComingSoonPage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = use(params);
  const data = FEATURES[feature];

  // Unknown feature slug — fall back to a generic message
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Page not found</CardTitle>
            <CardDescription>This feature doesn&apos;t exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to home
        </Link>

        <Card className="overflow-hidden border-indigo-100 shadow-xl">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-10 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-semibold tracking-wide">
                <Rocket className="h-3 w-3" />
                COMING SOON
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-5xl">{data.icon}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{data.title}</h1>
                <p className="text-white/80 mt-1">{data.tagline}</p>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            <p className="text-gray-600 leading-relaxed mb-6">{data.description}</p>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p className="font-semibold text-indigo-900 flex items-center gap-1.5 mb-3">
                <Sparkles className="h-4 w-4" />
                What you&apos;ll get
              </p>
              <ul className="space-y-2">
                {data.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-indigo-800">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              We&apos;re working hard to ship this. Check back soon! 🚀
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
