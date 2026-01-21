'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { tasksApi, dashboardApi } from '@/lib/api';

export default function TasksPage() {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list({ take: 100 }),
  });

  const { data: overdueStages } = useQuery({
    queryKey: ['dashboard-overdue'],
    queryFn: dashboardApi.getOverdue,
  });

  const { data: dueToday } = useQuery({
    queryKey: ['dashboard-due-today'],
    queryFn: dashboardApi.getDueToday,
  });

  const completeMutation = useMutation({
    mutationFn: tasksApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task completed');
    },
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tasks & Work Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your tasks and process stages
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue Stages */}
        <div className="card">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg font-medium text-red-900 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Overdue Stages ({overdueStages?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {overdueStages && overdueStages.length > 0 ? (
              overdueStages.map((stage: any) => (
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
                        {stage.stageTemplate.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {stage.processInstance.processTemplate.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        Overdue
                      </span>
                      {stage.dueAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {format(new Date(stage.dueAt), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">
                No overdue stages
              </p>
            )}
          </div>
        </div>

        {/* Due Today */}
        <div className="card">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-yellow-50">
            <h3 className="text-lg font-medium text-yellow-900 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Due Today ({dueToday?.length || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {dueToday && dueToday.length > 0 ? (
              dueToday.map((stage: any) => (
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
                        {stage.stageTemplate.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {stage.processInstance.processTemplate.name}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      Due Today
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">
                Nothing due today
              </p>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="card lg:col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              My Tasks ({tasks?.tasks?.filter((t: any) => t.status !== 'COMPLETED').length || 0})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : tasks?.tasks?.length > 0 ? (
              tasks.tasks
                .filter((task: any) => task.status !== 'COMPLETED')
                .map((task: any) => (
                  <div key={task.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => completeMutation.mutate(task.id)}
                        disabled={completeMutation.isPending}
                        className="flex-shrink-0 h-6 w-6 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 flex items-center justify-center"
                      >
                        <CheckIcon className="h-4 w-4 text-gray-400 hover:text-green-500" />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.patient && (
                          <Link
                            href={`/patients/${task.patient.id}`}
                            className="text-sm text-primary-600 hover:underline"
                          >
                            {task.patient.firstName} {task.patient.lastName}
                          </Link>
                        )}
                        {task.description && (
                          <p className="text-sm text-gray-500">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.priority === 'URGENT'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : task.priority === 'NORMAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.dueAt && (
                        <span
                          className={`text-xs ${
                            new Date(task.dueAt) < new Date()
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          Due: {format(new Date(task.dueAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <p className="px-4 py-8 text-sm text-gray-500 text-center">No tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
