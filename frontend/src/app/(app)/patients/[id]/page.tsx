'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { patientsApi, updatesApi, processInstancesApi, processTemplatesApi } from '@/lib/api';

const TABS = [
  { id: 'demographics', name: 'Demographics' },
  { id: 'contact', name: 'Contact' },
  { id: 'addresses', name: 'Addresses' },
  { id: 'emergency', name: 'Emergency Contacts' },
  { id: 'insurance', name: 'Insurance/Medicaid' },
  { id: 'medical', name: 'PCP/Diagnosis' },
  { id: 'updates', name: 'Updates' },
  { id: 'processes', name: 'Stages/Processes' },
];

export default function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const patientId = params.id as string;
  const initialTab = searchParams.get('tab') || 'demographics';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
  });

  const { data: updates } = useQuery({
    queryKey: ['patient-updates', patientId],
    queryFn: () => updatesApi.list(patientId),
    enabled: activeTab === 'updates',
  });

  const { data: templates } = useQuery({
    queryKey: ['process-templates'],
    queryFn: processTemplatesApi.list,
    enabled: activeTab === 'processes',
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => updatesApi.create(patientId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-updates', patientId] });
      setNewNote('');
      toast.success('Note added');
    },
  });

  const startProcessMutation = useMutation({
    mutationFn: (templateId: string) =>
      processInstancesApi.create(patientId, { processTemplateId: templateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast.success('Process started');
    },
  });

  const advanceStageMutation = useMutation({
    mutationFn: ({ instanceId, stageId }: { instanceId: string; stageId: string }) =>
      processInstancesApi.advanceStage(instanceId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
      toast.success('Stage advanced');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!patient) {
    return <div className="text-center py-8">Patient not found</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.middleName ? `${patient.middleName} ` : ''}
              {patient.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {patient.dateOfBirth &&
                `DOB: ${format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}`}
              {patient.preferredLanguage && ` | Language: ${patient.preferredLanguage.toUpperCase()}`}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              patient.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {patient.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {/* Demographics Tab */}
        {activeTab === 'demographics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="label">First Name</label>
                <p className="text-gray-900">{patient.firstName}</p>
              </div>
              <div>
                <label className="label">Middle Name</label>
                <p className="text-gray-900">{patient.middleName || '-'}</p>
              </div>
              <div>
                <label className="label">Last Name</label>
                <p className="text-gray-900">{patient.lastName}</p>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <p className="text-gray-900">
                  {patient.dateOfBirth
                    ? format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <label className="label">Gender</label>
                <p className="text-gray-900">{patient.gender}</p>
              </div>
              <div>
                <label className="label">Preferred Language</label>
                <p className="text-gray-900">{patient.preferredLanguage?.toUpperCase() || 'EN'}</p>
              </div>
              <div>
                <label className="label">Assigned Rep</label>
                <p className="text-gray-900">
                  {patient.owner
                    ? `${patient.owner.firstName} ${patient.owner.lastName}`
                    : 'Unassigned'}
                </p>
              </div>
            </div>
            {patient.notes && (
              <div>
                <label className="label">Notes</label>
                <p className="text-gray-900 whitespace-pre-wrap">{patient.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Contact Information</h3>
            </div>
            {patient.contacts?.length > 0 ? (
              <div className="space-y-4">
                {patient.contacts.map((contact: any) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {contact.type} - {contact.label}
                        {contact.isPrimary && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600">{contact.value}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {contact.canContact ? 'Can contact' : 'No contact'}
                        {contact.type === 'PHONE' && (contact.canText ? ' | Can text' : ' | No text')}
                        {contact.doNotContact && ' | DO NOT CONTACT'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No contacts on file</p>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Addresses</h3>
            </div>
            {patient.addresses?.length > 0 ? (
              <div className="space-y-4">
                {patient.addresses.map((address: any) => (
                  <div
                    key={address.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium">
                      {address.type}
                      {address.isPrimary && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-gray-600">
                      {address.street1}
                      {address.street2 && `, ${address.street2}`}
                    </p>
                    <p className="text-gray-600">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    {address.county && (
                      <p className="text-gray-500 text-sm">County: {address.county}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No addresses on file</p>
            )}
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === 'emergency' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Emergency Contacts</h3>
            </div>
            {patient.emergencyContacts?.length > 0 ? (
              <div className="space-y-4">
                {patient.emergencyContacts.map((ec: any) => (
                  <div
                    key={ec.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <p className="font-medium">
                      {ec.firstName} {ec.lastName}
                      {ec.isPrimary && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-gray-600">Relationship: {ec.relationship}</p>
                    {ec.phone && <p className="text-gray-600">Phone: {ec.phone}</p>}
                    {ec.email && <p className="text-gray-600">Email: {ec.email}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No emergency contacts on file</p>
            )}
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Insurance Policies</h3>
            </div>
            {patient.insurancePolicies?.length > 0 ? (
              <div className="space-y-4">
                {patient.insurancePolicies.map((policy: any) => (
                  <div
                    key={policy.id}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">
                        {policy.payerName}
                        {policy.isPrimary && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          policy.verificationStatus === 'VERIFIED'
                            ? 'bg-green-100 text-green-800'
                            : policy.verificationStatus === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {policy.verificationStatus}
                      </span>
                    </div>
                    <p className="text-gray-600">Type: {policy.type}</p>
                    {policy.memberId && (
                      <p className="text-gray-600">Member ID: {policy.memberId}</p>
                    )}
                    {policy.cin && <p className="text-gray-600">CIN: {policy.cin}</p>}
                    {policy.planName && (
                      <p className="text-gray-600">Plan: {policy.planName}</p>
                    )}
                    {policy.effectiveDate && (
                      <p className="text-gray-500 text-sm">
                        Effective: {format(new Date(policy.effectiveDate), 'MM/dd/yyyy')}
                        {policy.terminationDate &&
                          ` - ${format(new Date(policy.terminationDate), 'MM/dd/yyyy')}`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No insurance policies on file</p>
            )}
          </div>
        )}

        {/* Medical Info Tab */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            {patient.medicalInfo ? (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4">Primary Care Physician</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="label">Name</label>
                      <p>{patient.medicalInfo.pcpName || '-'}</p>
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <p>{patient.medicalInfo.pcpPhone || '-'}</p>
                    </div>
                    <div>
                      <label className="label">NPI</label>
                      <p>{patient.medicalInfo.pcpNpi || '-'}</p>
                    </div>
                    <div>
                      <label className="label">Fax</label>
                      <p>{patient.medicalInfo.pcpFax || '-'}</p>
                    </div>
                  </div>
                </div>

                {patient.medicalInfo.diagnoses?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Diagnoses</h3>
                    <div className="space-y-2">
                      {patient.medicalInfo.diagnoses.map((dx: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-mono text-sm bg-gray-200 px-2 py-0.5 rounded mr-2">
                            {dx.code}
                          </span>
                          {dx.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {patient.medicalInfo.allergies?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Allergies</h3>
                    <div className="flex flex-wrap gap-2">
                      {patient.medicalInfo.allergies.map((allergy: string, i: number) => (
                        <span
                          key={i}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {patient.medicalInfo.medications?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Medications</h3>
                    <div className="space-y-2">
                      {patient.medicalInfo.medications.map((med: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">{med.name}</span>
                          {med.dosage && ` - ${med.dosage}`}
                          {med.frequency && ` (${med.frequency})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {patient.medicalInfo.notes && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Medical Notes</h3>
                    <p className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {patient.medicalInfo.notes}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">No medical information on file</p>
            )}
          </div>
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Add Note</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter a note..."
                rows={3}
                className="input"
              />
              <button
                onClick={() => addNoteMutation.mutate(newNote)}
                disabled={!newNote.trim() || addNoteMutation.isPending}
                className="btn-primary mt-2"
              >
                Add Note
              </button>
            </div>

            <h3 className="text-lg font-medium mb-4">Timeline</h3>
            {updates?.updates?.length > 0 ? (
              <div className="space-y-4">
                {updates.updates.map((update: any) => (
                  <div
                    key={update.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      update.type === 'MANUAL'
                        ? 'bg-blue-50 border-blue-500'
                        : update.type === 'STAGE_CHANGE'
                        ? 'bg-green-50 border-green-500'
                        : update.type === 'COMMUNICATION'
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-gray-50 border-gray-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {update.type.replace('_', ' ')}
                        </span>
                        <p className="mt-1 text-gray-900">{update.content}</p>
                        {update.processInstance && (
                          <p className="text-xs text-gray-500 mt-1">
                            Process: {update.processInstance.processTemplate?.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{format(new Date(update.createdAt), 'MMM d, yyyy')}</p>
                        <p>{format(new Date(update.createdAt), 'h:mm a')}</p>
                        {update.createdBy && (
                          <p>
                            by {update.createdBy.firstName} {update.createdBy.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No updates yet</p>
            )}
          </div>
        )}

        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Start New Process</h3>
              <div className="flex gap-2 flex-wrap">
                {templates?.map((template: any) => (
                  <button
                    key={template.id}
                    onClick={() => startProcessMutation.mutate(template.id)}
                    disabled={startProcessMutation.isPending}
                    className="btn-secondary"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <h3 className="text-lg font-medium mb-4">Active Processes</h3>
            {patient.processInstances?.length > 0 ? (
              <div className="space-y-6">
                {patient.processInstances.map((process: any) => (
                  <div key={process.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{process.processTemplate?.name}</h4>
                        <p className="text-sm text-gray-500">
                          Started: {format(new Date(process.startedAt), 'MMM d, yyyy')}
                          {process.dueAt &&
                            ` | Due: ${format(new Date(process.dueAt), 'MMM d, yyyy')}`}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          process.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : process.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : process.status === 'ON_HOLD'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {process.status}
                        {process.outcome && ` - ${process.outcome}`}
                      </span>
                    </div>

                    {/* Stage Progress */}
                    <div className="space-y-2">
                      {process.stageInstances
                        ?.sort((a: any, b: any) => a.stageTemplate.order - b.stageTemplate.order)
                        .map((stage: any, index: number) => {
                          const isActive = stage.status === 'ACTIVE';
                          const isCompleted = stage.status === 'COMPLETED';
                          const nextStage = process.stageInstances?.find(
                            (s: any) =>
                              s.stageTemplate.order === stage.stageTemplate.order + 1 &&
                              s.status === 'PENDING'
                          );

                          return (
                            <div
                              key={stage.id}
                              className={`p-3 rounded ${
                                isActive
                                  ? 'bg-primary-50 border border-primary-200'
                                  : isCompleted
                                  ? 'bg-green-50'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                      isCompleted
                                        ? 'bg-green-500 text-white'
                                        : isActive
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                    }`}
                                  >
                                    {index + 1}
                                  </span>
                                  <span className={isActive ? 'font-medium' : ''}>
                                    {stage.stageTemplate.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {stage.dueAt && (
                                    <span
                                      className={`text-xs ${
                                        new Date(stage.dueAt) < new Date() && isActive
                                          ? 'text-red-600 font-medium'
                                          : 'text-gray-500'
                                      }`}
                                    >
                                      Due: {format(new Date(stage.dueAt), 'MMM d')}
                                    </span>
                                  )}
                                  {isActive && nextStage && process.status === 'ACTIVE' && (
                                    <button
                                      onClick={() =>
                                        advanceStageMutation.mutate({
                                          instanceId: process.id,
                                          stageId: nextStage.id,
                                        })
                                      }
                                      disabled={advanceStageMutation.isPending}
                                      className="btn-primary text-xs py-1 px-2"
                                    >
                                      Advance
                                    </button>
                                  )}
                                  {isActive &&
                                    stage.stageTemplate.isFinalStage &&
                                    process.status === 'ACTIVE' && (
                                      <button
                                        onClick={() =>
                                          advanceStageMutation.mutate({
                                            instanceId: process.id,
                                            stageId: stage.id,
                                          })
                                        }
                                        disabled={advanceStageMutation.isPending}
                                        className="btn-primary text-xs py-1 px-2"
                                      >
                                        Complete
                                      </button>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No processes started</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
