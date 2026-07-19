'use client';

import { Suspense } from 'react';
import { ResumeBuilder } from '@/components/resume-builder/ResumeBuilder';

export default function ResumeBuilderPage() {
  return <Suspense fallback={<div className="grid min-h-[70vh] place-items-center text-sm text-slate-500">Loading resume builder...</div>}><ResumeBuilder /></Suspense>;
}
