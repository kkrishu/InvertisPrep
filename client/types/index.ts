// User types
export type UserRole = 'student' | 'admin' | 'super-admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  picture?: string;
  studentId?: string;
  phoneNumber?: string;
  course?: string;
  followers?: string[];
  following?: string[];
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface UserResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface PublicUserProfile {
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    role: string;
    course: string;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  lastPapers: PYQPaper[];
}

// Department types
export interface Department {
  _id: string;
  id: string;
  name: string;
  displayName: string;
  icon: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDTO {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  description: string;
}

// Branch types
export interface Branch {
  _id: string;
  id: string;
  name: string;
  departmentId: string | Department;
  semesters: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDTO {
  id: string;
  name: string;
  departmentId: string;
  semesters: number[];
}

// Session types
export interface Session {
  _id: string;
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDTO {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
}

// PYQ types
export type ExamType = 'mid-term' | 'end-term' | 'sessional';

export interface PYQPaper {
  _id: string;
  title: string;
  subjectName: string;
  subjectCode?: string;
  departmentId: string | Department;
  branchId: string | Branch;
  sessionId: string | Session;
  semester: number;
  examType: ExamType;
  year: number;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  fileName: string;
  fileSize?: number;
  uploadedBy: string | User;
  views: number;
  downloads: number;
  viewCount: number;
  downloadCount: number;
  verified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPYQDTO {
  departmentId: string;
  branchId: string;
  sessionId: string;
  semester: number;
  subjectName: string;
  subjectCode?: string;
  examType: ExamType;
  year: number;
  pdf: File;
}

export interface PYQFilterQuery {
  departmentId?: string;
  branchId?: string;
  sessionId?: string;
  semester?: number;
  examType?: ExamType;
  subjectCode?: string;
  search?: string;
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  error?: string;
}

// Report types
export interface Report {
  _id: string;
  paperId: PYQPaper;
  reportedBy: User;
  reason: 'wrong_file' | 'poor_quality' | 'wrong_metadata' | 'other';
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

// Resume builder types
export interface ResumeLink { _id?: string; label: string; url: string; }
export interface ResumeEducation { _id?: string; institution: string; degree: string; startDate: string; endDate: string; }
export interface ResumeExperience { _id?: string; company: string; role: string; description: string; achievements: string[]; startDate: string; endDate: string; }
export interface ResumeProject { _id?: string; name: string; url: string; description: string; achievements: string[]; startDate: string; endDate: string; }
export interface ResumeSkillGroup { _id?: string; title: string; items: string[]; }
export interface ResumePersonal { name: string; headline: string; email: string; phone: string; location: string; links: ResumeLink[]; }
export interface Resume {
  _id: string;
  title: string;
  personal: ResumePersonal;
  summary: string;
  education: ResumeEducation[];
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skillGroups: ResumeSkillGroup[];
  achievements: string[];
  languages: string[];
  certifications: string[];
  createdAt: string;
  updatedAt: string;
}
export type ResumeDraft = Omit<Resume, '_id' | 'createdAt' | 'updatedAt'>;
