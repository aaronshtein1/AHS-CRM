'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { patientsApi } from '@/lib/api';

interface PatientForm {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage?: string;
  notes?: string;
}

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientForm>();

  const createMutation = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: (data) => {
      toast.success('Patient created successfully');
      router.push(`/patients/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create patient');
    },
  });

  const onSubmit = (data: PatientForm) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
      </div>

      <div className="card p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="label">First Name *</label>
              <input
                type="text"
                className="input"
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Middle Name</label>
              <input type="text" className="input" {...register('middleName')} />
            </div>

            <div>
              <label className="label">Last Name *</label>
              <input
                type="text"
                className="input"
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" {...register('dateOfBirth')} />
            </div>

            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="UNKNOWN">Unknown</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Preferred Language</label>
              <select className="input" {...register('preferredLanguage')}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="zh">Chinese</option>
                <option value="ru">Russian</option>
                <option value="ko">Korean</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea rows={3} className="input" {...register('notes')} />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Patient'}
            </button>
            <Link href="/patients" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
