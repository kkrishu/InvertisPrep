'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Department, APIResponse } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Search, FolderOpen } from 'lucide-react';

export default function PYQBrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: response, error, isLoading } = useSWR<APIResponse<Department[]>>(
    '/departments',
    fetcher,
    { revalidateOnFocus: false }
  );

  const departments = response?.data || [];

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    return departments.filter(
      (dept) =>
        dept.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, departments]);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse PYQ Papers</h1>
          <p className="text-xl text-muted-foreground">
            Select your department to view previous year question papers
          </p>
        </div>

        {/* Search Input for Departments */}
        {!isLoading && departments.length > 0 && (
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search departments (e.g. B.Tech, BCA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full bg-white shadow-sm"
              />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>Failed to load departments. Please try again.</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg text-muted-foreground">
                No departments available yet. Please check back later.
              </p>
            </CardContent>
          </Card>
        ) : filteredDepartments.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-600">No departments found matching &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Try checking the spelling or search by different keywords.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredDepartments.map((dept) => (
              <Link key={dept._id} href={`/pyq/${dept._id}`}>
                <Card className="group h-full overflow-hidden border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-sky-50 text-5xl shadow-sm ring-1 ring-slate-100">
                        {dept.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                          {dept.displayName}
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-slate-500">
                          {dept.name}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {dept.description && (
                    <CardContent className="pt-0 pb-6">
                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {dept.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Can&apos;t find your department?{' '}
            <a href="/admin/login" className="text-primary hover:underline">
              Contact admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
