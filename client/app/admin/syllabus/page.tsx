'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Trash2, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { syllabusApi } from '@/lib/api';

interface Syllabus {
  _id: string;
  name: string;
  department: string;
  year: string;
  fileSize: number;
  fileName: string;
  uploadedBy?: { name: string; email: string };
  createdAt: string;
  cloudinaryUrl?: string;
}

export default function SyllabusManagementPage() {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    year: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const departments = [
    'B.A.',
    'B.E.',
    'B.Sc',
    'B.Tech',
    'M.A.',
    'M.E.',
    'M.Sc',
    'MBA',
    'M.Tech',
    'B.C.A.',
    'Other',
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      const data = await syllabusApi.getAll();
      setSyllabus(data.data || []);
    } catch (err) {
      setError('Failed to load syllabus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.name) {
      setError('Please provide a name and select a file');
      return;
    }

    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const uploadFormData = new FormData();
      uploadFormData.append('pdf', file);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('department', 'Syllabus');
      uploadFormData.append('year', new Date().getFullYear().toString());

      const data = await syllabusApi.upload(uploadFormData);

      if (data.success) {
        setSuccess('Syllabus uploaded successfully');
        setFormData({ name: '', department: '', year: '' });
        setFile(null);
        fetchSyllabus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Failed to upload syllabus');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;

    try {
      const data = await syllabusApi.delete(id);

      if (data.success) {
        setSuccess('Syllabus deleted successfully');
        fetchSyllabus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Delete failed');
      }
    } catch (err) {
      setError('Failed to delete syllabus');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Syllabus</h1>
              <p className="text-gray-600">Upload and manage syllabus PDFs</p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Upload Form Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Upload New Syllabus
              </CardTitle>
              <CardDescription>Add a new syllabus document to the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="flex flex-col md:flex-row items-end gap-4">
                  {/* Syllabus Name */}
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Syllabus Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., B.A. B.Ed Syllabus"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Hidden fields for required logic */}
                  <input type="hidden" name="department" value="Syllabus" />
                  <input type="hidden" name="year" value={new Date().getFullYear().toString()} />

                  {/* PDF File */}
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PDF File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={uploading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>

                {/* File Info */}
                {file && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Selected File:</strong> {file.name} ({formatFileSize(file.size)})
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Syllabus List Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                All Syllabus ({syllabus.length})
              </CardTitle>
              <CardDescription>Manage all uploaded syllabus documents</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading syllabus...</p>
                </div>
              ) : syllabus.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No syllabus uploaded yet. Start by uploading your first syllabus above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Year</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Uploaded</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Uploaded By</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syllabus.map((item) => (
                        <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.year}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatFileSize(item.fileSize)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDate(item.createdAt)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.uploadedBy?.name || 'Admin'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              {item.cloudinaryUrl && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/view/${item._id}?type=syllabus`)}
                                    className="flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/view/${item._id}?type=syllabus`)}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="h-3 w-3" />
                                    Download
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item._id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
