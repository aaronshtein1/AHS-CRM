'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const { data: overdueStages } = useQuery({
    queryKey: ['dashboard-overdue'],
    queryFn: dashboardApi.getOverdue,
  });

  const { data: dueToday } = useQuery({
    queryKey: ['dashboard-due-today'],
    queryFn: dashboardApi.getDueToday,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardApi.getRecentActivity,
  });

  const statCards = [
    {
      name: 'Active Patients',
      value: stats?.activePatients || 0,
      icon: UsersIcon,
      href: '/patients',
      color: 'bg-blue-500',
    },
    {
      name: 'Active Processes',
      value: stats?.activeProcesses || 0,
      icon: ClipboardDocumentListIcon,
      href: '/patients',
      color: 'bg-green-500',
    },
    {
      name: 'Due Today',
      value: dueToday?.length || 0,
      icon: ClockIcon,
      href: '/tasks',
      color: 'bg-yellow-500',
    },
    {
      name: 'Overdue Stages',
      value: stats?.overdueStages || 0,
      icon: ExclamationTriangleIcon,
      href: '/tasks',
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.firstName}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue Stages */}
        <div className="card">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Overdue Stages</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {overdueStages && overdueStages.length > 0 ? (
              overdueStages.slice(0, 5).map((stage: any) => (
                <Link
                  key={stage.id}
                  href={`/patients/${stage.processInstance.patient.id}?tab=processes`}
                  className="block px-4 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {stage.processInstance.patient.firstName}{' '}
                        {stage.processInstance.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stage.stageTemplate.name} - {stage.processInstance.processTemplate.name}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Overdue
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-500">No overdue stages</p>
            )}
          </div>
        </div>

        {/* Due Today */}
        <div className="card">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Due Today</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {dueToday && dueToday.length > 0 ? (
              dueToday.slice(0, 5).map((stage: any) => (
                <Link
                  key={stage.id}
                  href={`/patients/${stage.processInstance.patient.id}?tab=processes`}
                  className="block px-4 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {stage.processInstance.patient.firstName}{' '}
                        {stage.processInstance.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stage.stageTemplate.name} - {stage.processInstance.processTemplate.name}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Due Today
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-500">Nothing due today</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card lg:col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.slice(0, 10).map((update: any) => (
                <Link
                  key={update.id}
                  href={`/patients/${update.patientId}?tab=updates`}
                  className="block px-4 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {update.patient.firstName} {update.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{update.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(update.createdAt), 'MMM d, yyyy h:mm a')}
                        {update.createdBy && ` by ${update.createdBy.firstName} ${update.createdBy.lastName}`}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        update.type === 'MANUAL'
                          ? 'bg-blue-100 text-blue-800'
                          : update.type === 'SYSTEM'
                          ? 'bg-gray-100 text-gray-800'
                          : update.type === 'STAGE_CHANGE'
                          ? 'bg-green-100 text-green-800'
                          : update.type === 'COMMUNICATION'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {update.type.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
