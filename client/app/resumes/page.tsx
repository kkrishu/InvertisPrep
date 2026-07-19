'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi } from '@/lib/api';
import { createStarterResume } from '@/components/resume-builder/ResumeBuilder';
import type { Resume } from '@/types';

export default function ResumesDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadResumes = async () => {
    try {
      const response = await resumeApi.list();
      setResumes(response.data || []);
    } catch { toast.error('Could not load your resumes'); }
    finally { setLoadingResumes(false); }
  };

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user) {
      const timer = window.setTimeout(() => { void loadResumes(); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [user, loading, router]);

  const createResume = async () => {
    setCreating(true);
    try {
      const response = await resumeApi.create(createStarterResume());
      if (!response.data) throw new Error();
      router.push(`/resume-builder?id=${response.data._id}`);
    } catch { toast.error('Could not create a new resume'); }
    finally { setCreating(false); }
  };

  const deleteResume = async (id: string) => {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await resumeApi.delete(id);
      setResumes((current) => current.filter((resume) => resume._id !== id));
      toast.success('Resume deleted');
    } catch { toast.error('Could not delete this resume'); }
  };

  if (loading || loadingResumes) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;

  return <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-4 py-10 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600">CAREER TOOLS</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">My resumes</h1><p className="mt-2 text-slate-600">Create a tailored, ATS-friendly resume for every opportunity.</p></div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60" onClick={createResume} disabled={creating}>{creating ? <Loader2 className="animate-spin" size={17}/> : <Plus size={17}/>} New resume</button>
      </div>
      {resumes.length === 0 ? <div className="rounded-2xl border border-dashed border-indigo-200 bg-white px-6 py-16 text-center"><FileText className="mx-auto h-10 w-10 text-indigo-400"/><h2 className="mt-4 text-lg font-bold text-slate-900">No resumes yet</h2><p className="mt-1 text-sm text-slate-500">Start from the ATS-friendly InvertisPrep template.</p><button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={createResume}><Plus size={17}/> Create your first resume</button></div> :
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{resumes.map((resume) => <article key={resume._id} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><FileText size={20}/></div><button className="rounded p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" onClick={() => deleteResume(resume._id)} aria-label={`Delete ${resume.title}`}><Trash2 size={17}/></button></div><h2 className="mt-5 truncate font-bold text-slate-900">{resume.title}</h2><p className="mt-1 truncate text-sm text-slate-500">{resume.personal?.name || 'Untitled resume'} {resume.personal?.headline ? `- ${resume.personal.headline}` : ''}</p><p className="mt-4 text-xs text-slate-400">Updated {new Date(resume.updatedAt).toLocaleDateString()}</p><Link href={`/resume-builder?id=${resume._id}`} className="mt-4 block rounded-lg border border-indigo-200 px-3 py-2 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50">Edit resume</Link></article>)}</div>}
    </div>
  </main>;
}
