'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { resumeApi } from '@/lib/api';
import type { Resume, ResumeDraft, ResumeEducation, ResumeExperience, ResumeLink, ResumeProject } from '@/types';
import { CheckCircle2, Clock, Download, FileUp, LayoutDashboard, Loader2, Plus, Printer, Save, Trash2 } from 'lucide-react';

const emptyEducation = (): ResumeEducation => ({ institution: '', degree: '', startDate: '', endDate: '' });
const emptyExperience = (): ResumeExperience => ({ company: '', role: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyProject = (): ResumeProject => ({ name: '', url: '', description: '', achievements: [''], startDate: '', endDate: '' });
const emptyLink = (): ResumeLink => ({ label: '', url: '' });

export function createStarterResume(): ResumeDraft {
  return {
    title: 'ATS Friendly Resume',
    personal: {
      name: 'Ahqaf Ali', headline: 'Developer', email: 'beddylea@gmail.com',
      phone: '+1-555-0100', location: 'San Francisco, CA',
      links: [
        { label: 'GitHub', url: 'github.com/ahqafcoder' },
        { label: 'LinkedIn', url: 'linkedin.com/in/bedivere-lea' },
        { label: 'Instagram', url: 'instagram.com/ahqafali0403' },
      ],
    },
    summary: 'Resourceful Developer with 11 years of experience in designing and developing user interfaces, testing and training employees. Skilled at utilizing a wide variety of tools and programs to provide effective applications.',
    education: [
      { institution: 'New York University', degree: 'Bachelor of Computer Science', startDate: '2020-08', endDate: '2024-07' },
    ],
    experience: [
      { company: 'Torph TTC', role: 'Developer', description: 'Torph TTC is a global software company that offers user interface UI development tools and components for a range of developer applications across all platforms.', achievements: ['Created and maintained 10 web applications for numerous national and foreign clients.', 'Ensured user interfaces and user experience met at least 80% of users expectations.', 'Created and analyzed 500 unit test cases.', "Developed Python scripts to automate image noise-reduction, improving research analysis time by 40%.", 'Established and led a team of 10 people, covering every key role in the early stages.'], startDate: '2023-02', endDate: '2023-02' },
      { company: 'Reilty Group', role: 'Front End Web Developer', description: 'Reilty Group is an industry-leading provider of online gambling software and solutions.', achievements: ['Increased the reach of users to the platform by 35% through mobile web installation.', 'Delivered 30 web solutions.', 'Replaced one full-time developer with part-time employment, achieving over 60% productivity gain.', 'Worked with more than four teams and provided end-to-end client solutions.'], startDate: '2023-02', endDate: '2023-03' },
      { company: 'HellX', role: 'Python Developer', description: 'Heller is a software editor specialized in logistics management.', achievements: ['Developed automation systems that saved over $50,000 annually.', 'Joined as the tenth employee and worked directly with major customers.', 'Delivered ahead of schedule, reducing project cost by 20%.', 'Reduced database size by nearly 50% and improved performance by 20%.', 'Reduced delivery time of goods by 50%.'], startDate: '2023-02', endDate: '2023-03' },
    ],
    projects: [],
    skillGroups: [
      { title: 'Technical Skills', items: ['JavaScript', 'Python', 'Web Services', 'C++', 'HTML5', 'CSS', 'SQL', 'User Interface', 'Creativity'] },
      { title: 'Soft Skills', items: ['Collaboration', 'Problem-solving', 'Communication', 'Time management', 'Result-oriented'] },
      { title: 'Additional Skills', items: ['Public Speaking', 'Writing', 'Research'] },
    ],
    achievements: [
      'Winner - Smart India Hackathon (SIH) 2025 | December 2025',
      'Technical Designer Award - Fashion Show | May 2026',
    ],
    languages: ['English', 'Hindi'],
    certifications: ['Certified Web Professional-Web Developer', 'Java Development Certified Professional'],
  };
}

// safeResume — lightweight structural safety pass for EXISTING saved resumes.
// Only ensures arrays are arrays and objects are objects. Never injects template content.
function safeResume(resume: Resume): Resume {
  // Migrate old generic template data that was seeded before the builder was live
  const isPreviousGenericTemplate =
    resume.title === 'Ahqaf Ali - Full Stack Developer' ||
    resume.summary?.startsWith('Motivated student and aspiring software developer') ||
    resume.projects?.some((project) => project.name === 'Student Portfolio Website');
  if (isPreviousGenericTemplate) {
    // Replace old generic template with the current starter so users get the new template
    return { ...resume, ...createStarterResume() };
  }

  const personal = resume.personal ?? { name: '', headline: '', email: '', phone: '', location: '', links: [] };
  return {
    ...resume,
    title: resume.title ?? '',
    personal: {
      name: personal.name ?? '',
      headline: personal.headline ?? '',
      email: personal.email ?? '',
      phone: personal.phone ?? '',
      location: personal.location ?? '',
      links: Array.isArray(personal.links)
        ? personal.links.map((link) => ({ ...emptyLink(), ...link }))
        : [],
    },
    summary: resume.summary ?? '',
    education: Array.isArray(resume.education)
      ? resume.education.map((item) => ({ ...emptyEducation(), ...item }))
      : [],
    experience: Array.isArray(resume.experience)
      ? resume.experience.map((item) => ({
          ...emptyExperience(), ...item,
          achievements: Array.isArray(item.achievements) ? item.achievements : [],
        }))
      : [],
    projects: Array.isArray(resume.projects)
      ? resume.projects.map((item) => ({
          ...emptyProject(), ...item,
          achievements: Array.isArray(item.achievements) ? item.achievements : [],
        }))
      : [],
    skillGroups: Array.isArray(resume.skillGroups)
      ? resume.skillGroups.map((group) => ({
          ...group,
          title: group.title ?? '',
          items: Array.isArray(group.items) ? group.items : [],
        }))
      : [],
    achievements: Array.isArray(resume.achievements) ? resume.achievements : [],
    languages: Array.isArray(resume.languages) ? resume.languages : [],
    certifications: Array.isArray(resume.certifications) ? resume.certifications : [],
  };
}

function toDraft(resume: Resume): ResumeDraft {
  return {
    title: resume.title,
    personal: resume.personal,
    summary: resume.summary,
    education: resume.education,
    experience: resume.experience,
    projects: resume.projects,
    skillGroups: resume.skillGroups,
    achievements: resume.achievements,
    languages: resume.languages,
    certifications: resume.certifications,
  };
}

function safeName(value: string) {
  return (value || 'resume').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function formatDate(value: string) {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!month) return year;
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function ResumeBuilder() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resume, setResume] = useState<Resume | null>(null);
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);

  // Task 3: dirty flag + saved timestamp for autosave indicator
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const firstAutosaveToastShown = useRef(false);

  // Task 1: track which id is already loaded to avoid redundant fetches
  const loadedIdRef = useRef<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Task 1: auth redirect — also unblock booting when user is definitively null
  useEffect(() => {
    if (!loading && !user) {
      setBooting(false);
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Task 1: id-keyed load effect — re-runs whenever ?id changes
  const idParam = searchParams.get('id');
  useEffect(() => {
    if (!user) return;
    // Skip if the ?id we want is already loaded
    if (idParam && loadedIdRef.current === idParam) return;

    let cancelled = false;
    setBooting(true);

    const load = async () => {
      try {
        if (idParam) {
          // Load a specific saved resume by its id directly — no guessing
          const result = await resumeApi.get(idParam);
          if (cancelled) return;
          if (!result.data) throw new Error('Resume not found');
          setResume(safeResume(result.data));
          loadedIdRef.current = idParam;
        } else {
          // No id in URL — open the first existing resume, or create a new starter
          const list = await resumeApi.list();
          if (cancelled) return;
          const first = list.data?.[0];
          if (first) {
            setResume(safeResume(first));
            loadedIdRef.current = first._id;
            router.replace(`/resume-builder?id=${first._id}`);
          } else {
            // No resumes exist yet — create a fresh starter
            const created = await resumeApi.create(createStarterResume());
            if (cancelled) return;
            if (!created.data) throw new Error('Could not create resume');
            setResume(safeResume(created.data));
            loadedIdRef.current = created.data._id;
            router.replace(`/resume-builder?id=${created.data._id}`);
          }
        }
        setIsDirty(false);
        setSavedAt(null);
      } catch {
        if (!cancelled) toast.error('Could not load your resume. Please try again.');
      } finally {
        if (!cancelled) setBooting(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idParam]);

  // Task 3: debounced autosave — fires 2s after last edit when isDirty
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback(async (draft = resume, isAuto = false) => {
    if (!draft) return;
    setSaving(true);
    try {
      await resumeApi.update(draft._id, toDraft(draft));
      setIsDirty(false);
      setSavedAt(new Date());
      if (!isAuto) toast.success('Resume saved');
      // Show the autosave toast only once per session
      if (isAuto && !firstAutosaveToastShown.current) {
        firstAutosaveToastShown.current = true;
        toast.success('Resume autosaved');
      }
    } catch {
      toast.error('Could not save the resume');
    } finally {
      setSaving(false);
    }
  }, [resume]);

  useEffect(() => {
    if (booting || !isDirty || !resume) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => { void save(resume, true); }, 2000);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [resume, isDirty, booting, save]);

  // Task 4: beforeunload guard — warn when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Mark dirty on every edit
  const update = (patch: Partial<Resume>) => {
    setResume((current) => current ? { ...current, ...patch } : current);
    setIsDirty(true);
  };
  const updatePersonal = (patch: Partial<Resume['personal']>) => {
    setResume((current) => current ? { ...current, personal: { ...current.personal, ...patch } } : current);
    setIsDirty(true);
  };

  const exportJson = () => {
    if (!resume) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(toDraft(resume), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName(resume.title)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !resume) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!imported.personal || !Array.isArray(imported.education) || !Array.isArray(imported.skillGroups)) throw new Error();
        setResume(safeResume({ ...resume, ...imported, _id: resume._id, createdAt: resume.createdAt, updatedAt: resume.updatedAt }));
        setIsDirty(true);
        toast.success('Resume data imported. Click Save to keep it.');
      } catch {
        toast.error('This is not a valid InvertisPrep resume file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (loading || booting || !resume) {
    return <div className="min-h-[70vh] grid place-items-center"><Loader2 className="h-7 w-7 animate-spin text-indigo-600" /></div>;
  }

  // Task 3: save status indicator label
  const SaveStatus = () => {
    if (saving) return <span className="flex items-center gap-1 text-xs text-slate-400"><Loader2 className="animate-spin" size={12}/> Saving…</span>;
    if (!isDirty && savedAt) return <span className="flex items-center gap-1 text-xs text-slate-400"><CheckCircle2 size={12} className="text-green-500"/> Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
    if (!isDirty && !savedAt) return <span className="flex items-center gap-1 text-xs text-slate-400"><CheckCircle2 size={12} className="text-green-500"/> All changes saved</span>;
    return <span className="flex items-center gap-1 text-xs text-amber-500"><Clock size={12}/> Unsaved changes</span>;
  };

  return (
    <div className="bg-slate-100 min-h-screen resume-builder-shell">
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div>
            <h1 className="font-bold text-slate-900">ATS Resume Builder</h1>
            <p className="text-xs text-slate-500">Clean, single-column content designed for easy ATS parsing.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveStatus />
            <Link className="resume-tool" href="/resumes"><LayoutDashboard size={16}/> My resumes</Link>
            <button className="resume-tool" onClick={() => importRef.current?.click()}><FileUp size={16}/> Import</button>
            <button className="resume-tool" onClick={exportJson}><Download size={16}/> Export</button>
            <button className="resume-tool" onClick={() => window.print()}><Printer size={16}/> PDF</button>
            <button className="resume-tool-primary" disabled={saving} onClick={() => save(resume, false)}>
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save
            </button>
            <input ref={importRef} className="hidden" type="file" accept="application/json,.json" onChange={importJson} />
          </div>
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(390px,0.82fr)_minmax(620px,1.18fr)]">
          <ResumeEditor resume={resume} update={update} updatePersonal={updatePersonal} />
          <ResumePreview resume={resume} />
        </div>
      </div>
    </div>
  );
}

function ResumeEditor({ resume, update, updatePersonal }: { resume: Resume; update: (patch: Partial<Resume>) => void; updatePersonal: (patch: Partial<Resume['personal']>) => void }) {
  const setArray = <K extends 'education' | 'experience' | 'projects' | 'skillGroups' | 'achievements' | 'languages' | 'certifications'>(key: K, value: Resume[K]) => update({ [key]: value } as Partial<Resume>);
  const field = 'w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100';
  return <aside className="no-print resume-editor rounded-xl bg-gradient-to-b from-fuchsia-600 to-purple-700 p-4 shadow-lg sm:p-5">
    <div className="mb-5"><label className="editor-label">Resume title</label><input className={field} value={resume.title} onChange={(e) => update({ title: e.target.value })} placeholder="My Resume" /></div>
    <EditorSection title="Personal information">
      <div className="grid gap-3 sm:grid-cols-2">
        <EditorInput label="Full name" value={resume.personal.name} onChange={(value) => updatePersonal({ name: value })} />
        <EditorInput label="Professional title" value={resume.personal.headline} onChange={(value) => updatePersonal({ headline: value })} />
        <EditorInput label="Phone" value={resume.personal.phone} onChange={(value) => updatePersonal({ phone: value })} />
        <EditorInput label="Email" type="email" value={resume.personal.email} onChange={(value) => updatePersonal({ email: value })} />
        <EditorInput label="Location" value={resume.personal.location} onChange={(value) => updatePersonal({ location: value })} />
      </div>
    </EditorSection>
    <EditorSection title="Social links" action={() => updatePersonal({ links: [emptyLink(), ...resume.personal.links] })}>
      {resume.personal.links.map((link, index) => <div className="mb-3 grid grid-cols-[1fr_1fr_auto] gap-2" key={link._id || index}>
        <input className={field} placeholder="GitHub" value={link.label} onChange={(e) => updatePersonal({ links: resume.personal.links.map((entry, i) => i === index ? { ...entry, label: e.target.value } : entry) })} />
        <input className={field} placeholder="github.com/name" value={link.url} onChange={(e) => updatePersonal({ links: resume.personal.links.map((entry, i) => i === index ? { ...entry, url: e.target.value } : entry) })} />
        <RemoveButton onClick={() => updatePersonal({ links: resume.personal.links.filter((_, i) => i !== index) })} />
      </div>)}
    </EditorSection>
    <EditorSection title="Summary"><textarea className={`${field} min-h-28`} value={resume.summary} onChange={(e) => update({ summary: e.target.value })} placeholder="Write a concise, achievement-focused professional summary." /></EditorSection>
    <EditorSection title="Education" action={() => setArray('education', [emptyEducation(), ...resume.education])}>
      {resume.education.map((item, index) => <div key={item._id || index} className="editor-card"><div className="grid gap-2 sm:grid-cols-2">
        <EditorInput compact placeholder="University / school" value={item.institution} onChange={(institution) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, institution } : entry))} />
        <EditorInput compact placeholder="Degree / course" value={item.degree} onChange={(degree) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, degree } : entry))} />
        <EditorInput compact type="month" value={item.startDate} onChange={(startDate) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, startDate } : entry))} />
        <EditorInput compact type="month" value={item.endDate} onChange={(endDate) => setArray('education', resume.education.map((entry, i) => i === index ? { ...entry, endDate } : entry))} />
      </div><RemoveButton onClick={() => setArray('education', resume.education.filter((_, i) => i !== index))} /></div>)}
    </EditorSection>
    <EditorSection title="Work experience" action={() => setArray('experience', [emptyExperience(), ...resume.experience])}>
      {resume.experience.map((item, index) => <ExperienceEditor key={item._id || index} item={item} onChange={(next) => setArray('experience', resume.experience.map((entry, i) => i === index ? next : entry))} onRemove={() => setArray('experience', resume.experience.filter((_, i) => i !== index))} />)}
    </EditorSection>
    <EditorSection title="Projects" action={() => setArray('projects', [emptyProject(), ...resume.projects])}>
      {resume.projects.map((item, index) => <ProjectEditor key={item._id || index} item={item} onChange={(next) => setArray('projects', resume.projects.map((entry, i) => i === index ? next : entry))} onRemove={() => setArray('projects', resume.projects.filter((_, i) => i !== index))} />)}
    </EditorSection>
    <EditorSection title="Skills" action={() => setArray('skillGroups', [{ title: 'New Skill Group', items: [] }, ...resume.skillGroups])}>
      {resume.skillGroups.map((group, index) => <div className="editor-card" key={group._id || index}><div className="flex gap-2"><input className={field} value={group.title} onChange={(e) => setArray('skillGroups', resume.skillGroups.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry))} /><RemoveButton onClick={() => setArray('skillGroups', resume.skillGroups.filter((_, i) => i !== index))} /></div><TagEditor values={group.items} onChange={(items) => setArray('skillGroups', resume.skillGroups.map((entry, i) => i === index ? { ...entry, items } : entry))} /></div>)}
    </EditorSection>
    <EditorSection title="Achievements"><TagEditor values={resume.achievements} onChange={(achievements) => setArray('achievements', achievements)} /></EditorSection>
    <EditorSection title="Languages"><TagEditor values={resume.languages} onChange={(languages) => setArray('languages', languages)} /></EditorSection>
    <EditorSection title="Certifications"><TagEditor values={resume.certifications} onChange={(certifications) => setArray('certifications', certifications)} /></EditorSection>
  </aside>;
}

function EditorSection({ title, children, action }: { title: string; children: React.ReactNode; action?: () => void }) { return <section className="mb-6"><div className="mb-2 flex items-center justify-between"><h2 className="text-base font-bold text-white">{title}</h2>{action && <button type="button" onClick={action} className="rounded bg-fuchsia-800 p-1.5 text-white hover:bg-fuchsia-900" aria-label={`Add ${title}`}><Plus size={16}/></button>}</div>{children}</section>; }
function EditorInput({ label, compact, ...props }: { label?: string; compact?: boolean; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className={label ? 'editor-label' : ''}>{label}<input className={`mt-1 w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-fuchsia-400 ${compact ? '' : ''}`} {...props} onChange={(e) => props.onChange(e.target.value)} /></label>; }
function RemoveButton({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="h-9 self-start rounded bg-fuchsia-800 p-2 text-white hover:bg-fuchsia-900" aria-label="Remove"><Trash2 size={16}/></button>; }
function TagEditor({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) { return <div className="mt-2 space-y-2">{values.map((value, index) => <div className="flex gap-2" key={index}><input className="w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none" value={value} placeholder="Add an item" onChange={(e) => onChange(values.map((entry, i) => i === index ? e.target.value : entry))}/><RemoveButton onClick={() => onChange(values.filter((_, i) => i !== index))}/></div>)}<button type="button" onClick={() => onChange(['', ...values])} className="inline-flex items-center gap-1 rounded bg-fuchsia-800 px-2 py-1.5 text-xs font-semibold text-white hover:bg-fuchsia-900"><Plus size={14}/> Add item</button></div>; }
function ExperienceEditor({ item, onChange, onRemove }: { item: ResumeExperience; onChange: (item: ResumeExperience) => void; onRemove: () => void }) { return <div className="editor-card"><div className="grid gap-2 sm:grid-cols-2"><EditorInput compact placeholder="Company" value={item.company} onChange={(company) => onChange({ ...item, company })}/><EditorInput compact placeholder="Role" value={item.role} onChange={(role) => onChange({ ...item, role })}/><EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })}/><EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })}/></div><textarea className="mt-2 min-h-20 w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none" value={item.description} placeholder="Company or role description (optional)" onChange={(e) => onChange({ ...item, description: e.target.value })}/><p className="mt-2 text-xs font-semibold text-white">Achievements — one item per line</p><textarea className="mt-1 min-h-24 w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none" value={item.achievements.join('\n')} onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })}/><RemoveButton onClick={onRemove}/></div>; }
function ProjectEditor({ item, onChange, onRemove }: { item: ResumeProject; onChange: (item: ResumeProject) => void; onRemove: () => void }) { return <div className="editor-card"><div className="grid gap-2 sm:grid-cols-2"><EditorInput compact placeholder="Project name" value={item.name} onChange={(name) => onChange({ ...item, name })}/><EditorInput compact placeholder="Project URL" value={item.url} onChange={(url) => onChange({ ...item, url })}/><EditorInput compact type="month" value={item.startDate} onChange={(startDate) => onChange({ ...item, startDate })}/><EditorInput compact type="month" value={item.endDate} onChange={(endDate) => onChange({ ...item, endDate })}/></div><textarea className="mt-2 min-h-20 w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none" value={item.description} placeholder="Project description" onChange={(e) => onChange({ ...item, description: e.target.value })}/><p className="mt-2 text-xs font-semibold text-white">Achievements — one item per line</p><textarea className="mt-1 min-h-24 w-full rounded-md border border-fuchsia-100 bg-white px-3 py-2 text-sm text-slate-900 outline-none" value={item.achievements.join('\n')} onChange={(e) => onChange({ ...item, achievements: e.target.value.split('\n') })}/><RemoveButton onClick={onRemove}/></div>; }

function ResumePreview({ resume }: { resume: Resume }) {
  const p = resume.personal;
  const hasLeft = resume.summary || resume.education.length || resume.skillGroups.some((group) => group.items.some(Boolean)) || resume.achievements.some(Boolean) || resume.languages.some(Boolean) || resume.certifications.some(Boolean);
  return <section className="resume-preview-wrap overflow-auto rounded-xl bg-slate-200 p-3 shadow-inner sm:p-5"><article className="resume-page mx-auto bg-white text-black shadow-xl">
    <header className="border-b border-slate-300 pb-3 text-center">
      <h1 className="text-[22px] font-bold uppercase tracking-wide">{p.name || 'Your Name'}</h1>
      {p.headline && <p className="mt-0.5 text-[15px]">{p.headline}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]">{p.phone && <span>{p.phone}</span>}{p.email && <span>{p.email}</span>}{p.location && <span>{p.location}</span>}</div>
      {p.links.some((link) => link.url) && <div className="mt-1.5 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">{p.links.filter((link) => link.url).map((link, i) => <span key={link._id || i}>{link.label ? `${link.label}: ` : ''}{link.url.replace(/^https?:\/\//, '')}</span>)}</div>}
    </header>
    <div className={hasLeft && (resume.experience.length || resume.projects.length) ? 'grid grid-cols-[31%_1fr] gap-7 pt-4' : 'pt-4'}>
      {hasLeft && <aside>
        {resume.summary && <PreviewSection title="Summary"><p>{resume.summary}</p></PreviewSection>}
        {resume.education.length > 0 && <PreviewSection title="Education">{resume.education.map((item, i) => <div className="mb-3" key={item._id || i}><p className="font-bold">{item.institution}</p><p>{item.degree}</p><DateLine start={item.startDate} end={item.endDate}/></div>)}</PreviewSection>}
        {resume.skillGroups.filter((group) => group.items.some(Boolean)).map((group, i) => <PreviewSection key={group._id || i} title={group.title}><p>{group.items.filter(Boolean).join(', ')}</p></PreviewSection>)}
        {resume.achievements.some(Boolean) && <PreviewSection title="Achievements"><ul>{resume.achievements.filter(Boolean).map((item, i) => <li key={i}>• {item}</li>)}</ul></PreviewSection>}
        {resume.languages.some(Boolean) && <PreviewSection title="Languages"><p>{resume.languages.filter(Boolean).join(', ')}</p></PreviewSection>}
        {resume.certifications.some(Boolean) && <PreviewSection title="Certifications"><ul>{resume.certifications.filter(Boolean).map((item, i) => <li key={i}>• {item}</li>)}</ul></PreviewSection>}
      </aside>}
      {(resume.experience.length || resume.projects.length) ? <main>
        {resume.experience.length > 0 && <PreviewSection title="Work Experience">{resume.experience.map((item, i) => <ExperiencePreview key={item._id || i} item={item}/>)}</PreviewSection>}
        {resume.projects.length > 0 && <PreviewSection title="Projects">{resume.projects.map((item, i) => <div className="mb-4" key={item._id || i}><div className="flex justify-between gap-3"><p className="font-bold">{item.name}</p><DateLine start={item.startDate} end={item.endDate}/></div>{item.url && <p className="text-[10px]">{item.url}</p>}{item.description && <p className="mt-1">{item.description}</p>}<AchievementList items={item.achievements}/></div>)}</PreviewSection>}
      </main> : null}
    </div>
    <footer className="resume-watermark">Made with www.invertisprep.in</footer>
  </article></section>;
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-4"><h2 className="mb-1 border-b-2 border-slate-300 pb-0.5 text-[15px] font-bold">{title}</h2><div className="resume-content">{children}</div></section>; }
function DateLine({ start, end }: { start: string; end: string }) { const text = [formatDate(start), formatDate(end)].filter(Boolean).join(' — '); return text ? <span className="shrink-0 whitespace-nowrap text-[11px]">{text}</span> : null; }
function AchievementList({ items }: { items: string[] }) { const values = items.filter(Boolean); return values.length ? <ul className="mt-1 list-disc pl-4">{values.map((item, i) => <li key={i}>{item}</li>)}</ul> : null; }
function ExperiencePreview({ item }: { item: ResumeExperience }) { return <div className="mb-4"><div className="flex justify-between gap-3"><p className="font-bold">{item.company}</p><DateLine start={item.startDate} end={item.endDate}/></div><p className="font-semibold">{item.role}</p>{item.description && <p className="mt-1">{item.description}</p>}<AchievementList items={item.achievements}/></div>; }
