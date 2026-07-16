'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { pyqApi } from '@/lib/api';
import type { PYQPaper, User, ExamType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

export default function PapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<PYQPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PYQPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    subjectName: '',
    subjectCode: '',
    year: '',
    examType: '',
    semester: '',
  });

  const fetchPapers = async (opts?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      const res = await pyqApi.getAll({ page: opts?.page ?? page, limit: opts?.limit ?? pageSize });
      setPapers(res.data || []);
      setFilteredPapers(res.data || []);
      setTotal(typeof (res as any).total === 'number' ? (res as any).total : (res.count ?? (res.data?.length || 0)));
    } catch (err: unknown) {
      setError('Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  const filterPapers = (searchTerm: string, papersToFilter: PYQPaper[]) => {
    if (!searchTerm.trim()) {
      return papersToFilter;
    }

    const term = searchTerm.toLowerCase();

    return papersToFilter.filter((paper) => {
      // Search in subject name and code
      if (
        paper.subjectName.toLowerCase().includes(term) ||
        (paper.subjectCode && paper.subjectCode.toLowerCase().includes(term))
      ) {
        return true;
      }

      // Search in department
      if (typeof paper.departmentId !== 'string') {
        if (
          paper.departmentId.name.toLowerCase().includes(term) ||
          paper.departmentId.displayName?.toLowerCase().includes(term)
        ) {
          return true;
        }
      }

      // Search in branch
      if (typeof paper.branchId !== 'string') {
        if (paper.branchId.name.toLowerCase().includes(term)) {
          return true;
        }
      }

      // Search in session
      if (typeof paper.sessionId !== 'string') {
        if (paper.sessionId.name.toLowerCase().includes(term)) {
          return true;
        }
      }

      // Search in exam type and year
      if (paper.examType.toLowerCase().includes(term) || paper.year.toString().includes(term)) {
        return true;
      }

      // Search in semester
      if (paper.semester.toString().includes(term)) {
        return true;
      }

      return false;
    });
  };

  useEffect(() => {
    const filtered = filterPapers(query, papers);
    setFilteredPapers(filtered);
    setPage(1);
  }, [query, papers]);

  useEffect(() => {
    fetchPapers({ page, limit: pageSize });
  }, []);

  useEffect(() => {
    // refetch when page or pageSize changes
    fetchPapers({ page, limit: pageSize });
  }, [page, pageSize]);

  const handleVerify = async (id: string) => {
    try {
      await pyqApi.verify(id);
      setSuccess('Paper verified successfully');
      fetchPapers();
    } catch (err: unknown) {
      let errorMessage = 'Failed to verify paper';
      const axiosError = err as any;
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper? This action cannot be undone.')) return;

    try {
      await pyqApi.delete(id);
      setSuccess('Paper deleted successfully');
      // deselect if selected
      setSelected((s) => s.filter((sid) => sid !== id));
      fetchPapers();
    } catch (err: unknown) {
      setError('Failed to delete paper');
    }
  };

  const handleEdit = (paper: PYQPaper) => {
    setEditFormData({
      subjectName: paper.subjectName,
      subjectCode: paper.subjectCode || '',
      year: paper.year.toString(),
      examType: paper.examType,
      semester: paper.semester.toString(),
    });
    setEditingId(paper._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      subjectName: '',
      subjectCode: '',
      year: '',
      examType: '',
      semester: '',
    });
  };

  const handleUpdatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const updateData: Partial<PYQPaper> = {
        subjectName: editFormData.subjectName,
        subjectCode: editFormData.subjectCode,
        year: parseInt(editFormData.year),
        examType: editFormData.examType as ExamType,
        semester: parseInt(editFormData.semester),
      };
      await pyqApi.update(editingId, updateData);
      setSuccess('Paper updated successfully');
      setEditingId(null);
      setEditFormData({
        subjectName: '',
        subjectCode: '',
        year: '',
        examType: '',
        semester: '',
      });
      fetchPapers();
    } catch (err: unknown) {
      let errorMessage = 'Failed to update paper';
      const axiosError = err as any;
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleDownload = async (paper: PYQPaper) => {
    try {
      await pyqApi.trackDownload(paper._id);
      router.push(`/view/${paper._id}?type=pyq`);
    } catch (err: unknown) {
      setError('Failed to track download');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectAllOnPage = () => {
    if (selected.length === filteredPapers.length) setSelected([]);
    else setSelected(filteredPapers.map((p) => p._id));
  };

  const handleBulkVerify = async () => {
    if (selected.length === 0) return setError('No papers selected');
    try {
      await Promise.all(selected.map((id) => pyqApi.verify(id)));
      setSuccess('Selected papers verified');
      setSelected([]);
      fetchPapers({ page, limit: pageSize });
    } catch (err: unknown) {
      setError('Failed to verify selected papers');
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return setError('No papers selected');
    if (!confirm('Delete selected papers? This cannot be undone.')) return;
    try {
      await Promise.all(selected.map((id) => pyqApi.delete(id)));
      setSuccess('Selected papers deleted');
      setSelected([]);
      fetchPapers({ page, limit: pageSize });
    } catch (err: unknown) {
      setError('Failed to delete selected papers');
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Search is now handled by filterPapers function via useEffect
  };

  const getDepartmentName = (paper: PYQPaper) => {
    if (typeof paper.departmentId === 'string') return 'N/A';
    return paper.departmentId.displayName || paper.departmentId.name;
  };

  const getBranchName = (paper: PYQPaper) => {
    if (typeof paper.branchId === 'string') return 'N/A';
    return paper.branchId.name;
  };

  const getSessionName = (paper: PYQPaper) => {
    if (typeof paper.sessionId === 'string') return 'N/A';
    return paper.sessionId.name;
  };

  const getUploadedBy = (paper: PYQPaper) => {
    if (typeof paper.uploadedBy === 'string') return 'Unknown';
    return (paper.uploadedBy as User).email;
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">PYQ Papers Management</h1>
            <p className="text-muted-foreground">View, verify, and manage uploaded papers</p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {editingId && (
          <Card className="mb-6 bg-blue-50">
            <CardHeader>
              <CardTitle>Edit Paper</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePaper} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Name *</label>
                    <input
                      type="text"
                      value={editFormData.subjectName}
                      onChange={(e) => setEditFormData({ ...editFormData, subjectName: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={editFormData.subjectCode}
                      onChange={(e) => setEditFormData({ ...editFormData, subjectCode: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Year *</label>
                    <input
                      type="number"
                      value={editFormData.year}
                      onChange={(e) => setEditFormData({ ...editFormData, year: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Exam Type *</label>
                    <select
                      value={editFormData.examType}
                      onChange={(e) => setEditFormData({ ...editFormData, examType: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                      required
                    >
                      <option value="">Select exam type</option>
                      <option value="mid-term">Mid-Term</option>
                      <option value="end-term">End-Term</option>
                      <option value="sessional">Sessional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Semester *</label>
                    <input
                      type="number"
                      value={editFormData.semester}
                      onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="sm">Save Changes</Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 text-sm text-muted-foreground flex items-center justify-between">
          <div>Total Papers: {total} {query && `(${filteredPapers.length} shown)`}</div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Search by name, code, dept, branch, session, year..." 
                className="px-2 py-1 border rounded" 
              />
              <Button type="submit" size="sm">Search</Button>
            </form>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={selectAllOnPage}>{selected.length === filteredPapers.length ? 'Unselect' : 'Select All'}</Button>
              <Button size="sm" onClick={handleBulkVerify} disabled={selected.length===0}>Verify Selected</Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={selected.length===0}>Delete Selected</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <p>Loading papers...</p>
          ) : papers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No papers found. Upload your first paper from the Upload page.
              </CardContent>
            </Card>
          ) : filteredPapers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No papers match your search. Try different keywords.
              </CardContent>
            </Card>
          ) : (
            filteredPapers.map((paper) => (
              <Card key={paper._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected.includes(paper._id)} onChange={() => toggleSelect(paper._id)} />
                      <div>
                        <CardTitle className="text-lg">{paper.subjectName}</CardTitle>
                        <CardDescription>
                          {paper.subjectCode} | {paper.examType.toUpperCase()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!paper.verified && (
                        <Button size="sm" variant="default" onClick={() => handleVerify(paper._id)}>
                          ✓ Verify
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDownload(paper)}>
                        Download
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(paper)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(paper._id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{getDepartmentName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{getBranchName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Session</p>
                      <p className="font-medium">{getSessionName(paper)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Semester</p>
                      <p className="font-medium">Semester {paper.semester}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{paper.year}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {paper.verified ? (
                          <span className="text-green-600">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600">⚠ Pending Verification</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Downloads</p>
                      <p className="font-medium">{paper.downloads ?? paper.downloadCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="font-medium">{paper.views ?? paper.viewCount ?? 0}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Uploaded By</p>
                      <p className="font-medium">{getUploadedBy(paper)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">File Name</p>
                      <p className="font-medium text-xs">{paper.fileName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Uploaded At</p>
                      <p className="font-medium text-xs">
                        {new Date(paper.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <span>Page {page}</span>
            <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>Next</Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Per page</label>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }} className="border px-2 py-1">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
