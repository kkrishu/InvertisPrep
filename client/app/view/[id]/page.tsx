'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { pdfApi } from '@/lib/api';
import PDFViewer from '@/components/PDFViewer';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ViewPDFContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = params.id as string;
  const type = (searchParams.get('type') as 'pyq' | 'syllabus') || 'pyq';

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication Check
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if not authenticated
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchPDF = async () => {
      // Don't fetch if still checking auth or not logged in
      if (authLoading || !user) return;

      try {
        setLoading(true);
        const blob = await pdfApi.view(id, type);
        setPdfBlob(blob);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching PDF:', err);

        let errorMessage = 'Failed to load document.';

        // Handle Blob error responses (when responseType is 'blob')
        if (err.response?.data instanceof Blob && err.response.data.type === 'application/json') {
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing blob error JSON:', e);
          }
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        if (err.response?.status === 401) {
          errorMessage += ' Please make sure you are logged in.';
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPDF();
    }
  }, [id, type, authLoading, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-500" />
        <p className="text-lg font-medium">Preparing protected viewer...</p>
        <p className="text-slate-400 text-sm mt-2">Fetching document and applying security watermarks</p>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.toLowerCase().includes('log in') || error.toLowerCase().includes('session');

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white p-4">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center shadow-2xl">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-slate-300 mb-6">{error}</p>

          <div className="flex flex-col gap-3">
            {isAuthError ? (
              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In Again
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700">
                Try Again
              </Button>
            )}
            <Button onClick={() => router.back()} variant="outline" className="text-white border-white/20 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500 text-left overflow-hidden">
              <p className="font-mono truncate">ID: {id}</p>
              <p className="font-mono">User: {user ? user.email : 'None'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {pdfBlob && <PDFViewer file={pdfBlob} />}
    </div>
  );
}

export default function ViewPDFPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-indigo-500" />
        <p className="text-lg font-medium">Initializing viewer...</p>
      </div>
    }>
      <ViewPDFContent />
    </Suspense>
  );
}
