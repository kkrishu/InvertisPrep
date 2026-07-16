'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { reportApi, pyqApi } from '@/lib/api';
import type { Report } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Flag, 
  Trash2, 
  CheckCircle, 
  ExternalLink, 
  XCircle, 
  Clock, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed' | 'all'>('pending');

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const filterValue = statusFilter === 'all' ? undefined : statusFilter;
      const res = await reportApi.getAll(filterValue);
      setReports(res.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleDismissReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to dismiss this report? The paper will remain on the platform.')) return;
    try {
      const res = await reportApi.updateStatus(reportId, 'dismissed');
      if (res.success) {
        setSuccess('Report dismissed successfully');
        fetchReports();
      } else {
        setError(res.message || 'Failed to dismiss report');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error dismissing report');
    }
  };

  const handleDeletePaperAndResolve = async (reportId: string, paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper and resolve the report? This will permanently delete the paper file and record.')) return;
    try {
      // 1. Delete paper
      const deleteRes = await pyqApi.delete(paperId);
      if (!deleteRes.success) {
        setError(deleteRes.message || 'Failed to delete paper');
        return;
      }

      // 2. Update report status to resolved
      const resolveRes = await reportApi.updateStatus(reportId, 'resolved');
      if (resolveRes.success) {
        setSuccess('Paper deleted and report marked as resolved successfully');
        fetchReports();
      } else {
        setError(resolveRes.message || 'Paper was deleted, but failed to resolve the report. You may need to resolve it manually.');
        fetchReports();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error processing action');
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'wrong_file': return 'Wrong File';
      case 'poor_quality': return 'Poor Quality';
      case 'wrong_metadata': return 'Wrong Metadata';
      case 'other': return 'Other Issue';
      default: return reason;
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'wrong_file': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'poor_quality': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'wrong_metadata': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': 
        return (
          <span className="flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full font-medium">
            <Clock className="h-3.5 w-3.5" /> Pending
          </span>
        );
      case 'resolved':
        return (
          <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle className="h-3.5 w-3.5" /> Resolved
          </span>
        );
      case 'dismissed':
        return (
          <span className="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
            <XCircle className="h-3.5 w-3.5" /> Dismissed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 max-w-6xl min-h-screen bg-gray-50/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Flag className="h-8 w-8 text-rose-500" />
              Reported Papers Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Review and act on user reports for incorrect, low-quality, or mismatched PYQ papers
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Notifications */}
        {error && (
          <Alert variant="destructive" className="mb-6 shadow-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800 shadow-sm">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Status Filters */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          {(['pending', 'resolved', 'dismissed', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setError('');
                setSuccess('');
              }}
              className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all capitalize -mb-[2px] ${
                statusFilter === filter
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter} Reports
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full mb-3" role="status"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-600">No {statusFilter !== 'all' ? statusFilter : ''} reports found</p>
              <p className="text-sm text-gray-400 mt-1">Excellent! There are no user reports in this section.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {reports.map((report) => {
              const paper = report.paperId;
              const hasPaper = !!paper;

              return (
                <Card key={report._id} className="shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden bg-white">
                  {/* Top Bar of the Card */}
                  <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${getReasonColor(report.reason)}`}>
                        {getReasonLabel(report.reason)}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div>{getStatusBadge(report.status)}</div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-12 gap-6">
                      
                      {/* Left: Paper info */}
                      <div className="md:col-span-7 space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Reported Paper Details</h3>
                          {hasPaper ? (
                            <div className="mt-2 space-y-1">
                              <h4 className="text-lg font-bold text-gray-900">{paper.subjectName}</h4>
                              <p className="text-sm text-gray-600 font-medium">
                                {paper.subjectCode || 'No Code'} | {paper.examType?.toUpperCase()} | Year {paper.year} | Semester {paper.semester}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                                <div>
                                  Department: <span className="font-semibold text-gray-700">{(paper.departmentId as any)?.displayName || 'N/A'}</span>
                                </div>
                                <div>
                                  Branch: <span className="font-semibold text-gray-700">{(paper.branchId as any)?.name || 'N/A'}</span>
                                </div>
                                <div>
                                  Session: <span className="font-semibold text-gray-700">{(paper.sessionId as any)?.name || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-rose-600 font-semibold flex items-center gap-1 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-sm">
                              <XCircle className="h-4 w-4" /> [Paper Already Deleted / Unavailable]
                            </div>
                          )}
                        </div>

                        {/* Description of Report */}
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User Explanation</h4>
                          <p className="text-sm text-gray-700 mt-1.5 italic font-medium">
                            "{report.description || 'No additional details provided.'}"
                          </p>
                        </div>
                      </div>

                      {/* Right: People profiles */}
                      <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between gap-4">
                        <div className="space-y-4">
                          {/* Reporter */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reported By</h3>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 border border-indigo-100">
                                {report.reportedBy?.picture ? (
                                  <AvatarImage src={report.reportedBy.picture} alt={report.reportedBy.name} />
                                ) : null}
                                <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">
                                  {report.reportedBy?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{report.reportedBy?.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500">{report.reportedBy?.email || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Paper Uploader */}
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Paper Uploaded By</h3>
                            {hasPaper && paper.uploadedBy ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border border-gray-200">
                                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-bold">
                                    {(paper.uploadedBy as any)?.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{(paper.uploadedBy as any)?.name || 'Faculty/System'}</p>
                                  <p className="text-xs text-gray-500">{(paper.uploadedBy as any)?.email || 'N/A'}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">System / Administrator</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons inside Card */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 md:border-t-0 md:pt-0">
                          {hasPaper && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => router.push(`/view/${paper._id}?type=pyq`)}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View PDF
                            </Button>
                          )}
                          {report.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => handleDismissReport(report._id)}
                                className="flex items-center gap-1 text-gray-700 hover:text-gray-900 border border-gray-200"
                              >
                                <XCircle className="h-3.5 w-3.5 text-gray-500" />
                                Dismiss
                              </Button>
                              {hasPaper && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeletePaperAndResolve(report._id, paper._id)}
                                  className="flex items-center gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete & Resolve
                                </Button>
                              )}
                            </>
                          )}
                        </div>

                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
