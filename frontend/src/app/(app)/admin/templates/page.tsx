'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { processTemplatesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function TemplatesPage() {
  const { user: currentUser } = useAuthStore();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['process-templates'],
    queryFn: processTemplatesApi.list,
  });

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Process Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage workflow templates and automation rules
          </p>
        </div>
        <Link href="/admin/templates/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Template
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : templates?.length > 0 ? (
          templates.map((template: any) => (
            <Link
              key={template.id}
              href={`/admin/templates/${template.id}`}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-primary-600" />
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    template.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {template.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{template.name}</h3>
              {template.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span>{template.stages?.length || 0} stages</span>
                <span>{template._count?.instances || 0} instances</span>
              </div>
              {template.defaultDueDays && (
                <p className="mt-2 text-xs text-gray-400">
                  Default SLA: {template.defaultDueDays} days
                </p>
              )}
            </Link>
          ))
        ) : (
          <div className="col-span-full card p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No templates created yet</p>
            <Link href="/admin/templates/new" className="btn-primary mt-4">
              Create First Template
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
