'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Phone, RefreshCw, HeartPulse, GripVertical } from 'lucide-react';
import { api } from '@/lib/api';

// All lifecycle stages in order
const LIFECYCLE_STAGES = [
  { key: 'NEW', label: 'New Lead', color: 'var(--accent-blue)' },
  { key: 'ATTEMPTING_CONTACT', label: 'Attempting Contact', color: 'var(--accent-amber)' },
  { key: 'CONTACTED', label: 'Contacted', color: 'var(--accent-cyan)' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'var(--accent-green)' },
  { key: 'ACTIVE_PATIENT', label: 'Active Patient', color: 'var(--accent-purple)' },
  { key: 'ON_HOLD', label: 'On Hold', color: 'var(--accent-amber)' },
  { key: 'DISCHARGED', label: 'Discharged', color: 'var(--text-muted)' },
  { key: 'UNQUALIFIED', label: 'Unqualified', color: 'var(--accent-red)' },
];

// Valid drag targets
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ATTEMPTING_CONTACT', 'CONTACTED', 'UNQUALIFIED'],
  ATTEMPTING_CONTACT: ['CONTACTED', 'UNQUALIFIED'],
  CONTACTED: ['QUALIFIED', 'UNQUALIFIED'],
  QUALIFIED: ['ACTIVE_PATIENT', 'UNQUALIFIED'],
  ACTIVE_PATIENT: ['ON_HOLD', 'DISCHARGED'],
  ON_HOLD: ['ACTIVE_PATIENT', 'DISCHARGED'],
  DISCHARGED: ['ACTIVE_PATIENT'],
  UNQUALIFIED: ['NEW'],
};

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: string;
  source: string;
  county?: string;
  serviceType?: string;
  totalCallAttempts: number;
  owner?: { firstName: string; lastName: string };
}

function DraggableCard({ lead, onSelect }: { lead: Lead; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 999 : 1 }
    : {};

  return (
    <div ref={setNodeRef} style={style} className="pipeline-card" onClick={onSelect}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div {...listeners} {...attributes} className="drag-handle" onClick={e => e.stopPropagation()}>
          <GripVertical size={14} />
        </div>
        <div className="pipeline-card-name">{lead.firstName} {lead.lastName}</div>
      </div>
      <div className="pipeline-card-meta">
        {lead.source && <span className="pipeline-card-tag tag-source">{lead.source.replace(/_/g, ' ')}</span>}
        {lead.serviceType && <span className="pipeline-card-tag tag-service">{lead.serviceType}</span>}
        {lead.county && <span className="pipeline-card-tag tag-county">{lead.county}</span>}
        {lead.totalCallAttempts > 0 && (
          <span className="pipeline-card-tag tag-calls">
            <Phone size={10} /> {lead.totalCallAttempts}
          </span>
        )}
      </div>
      {lead.owner && (
        <div className="pipeline-card-owner">{lead.owner.firstName} {lead.owner.lastName}</div>
      )}
    </div>
  );
}

function DroppableColumn({ stageKey, label, color, leads, onSelectLead, activeId }: {
  stageKey: string; label: string; color: string; leads: Lead[];
  onSelectLead: (id: string) => void; activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });

  const activeLeadStatus = activeId
    ? leads.find(l => l.id === activeId)?.status || ''
    : '';

  // Check if this column is a valid drop target for the currently dragged item
  // We need the source status from the drag context, not from this column's leads
  const isValidTarget = activeId ? true : false; // Will be refined in DndContext

  return (
    <motion.div
      className="pipeline-column"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="pipeline-column-header"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <span className="pipeline-column-title">{label}</span>
        <span className="pipeline-count">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`pipeline-cards ${isOver ? 'drop-highlight' : ''}`}
        style={{ minHeight: 80 }}
      >
        {leads.map(lead => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            onSelect={() => onSelectLead(lead.id)}
          />
        ))}
        {leads.length === 0 && (
          <div className="empty-state" style={{ padding: 24 }}><p>No leads</p></div>
        )}
      </div>
    </motion.div>
  );
}

export default function Pipeline({ token, onSelectLead }: { token: string; onSelectLead: (id: string) => void }) {
  const [pipeline, setPipeline] = useState<Record<string, Lead[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const loadPipeline = async () => {
    try {
      const data = await api.getPipeline(token);
      setPipeline(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPipeline(); }, [token]);

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    // Find the lead across all pipeline columns
    for (const leads of Object.values(pipeline)) {
      const found = (leads as Lead[]).find(l => l.id === active.id);
      if (found) { setActiveLead(found); break; }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over || !activeLead) return;

    const targetStatus = over.id as string;
    const sourceStatus = activeLead.status;

    if (targetStatus === sourceStatus) return;

    // Validate transition
    const allowed = VALID_TRANSITIONS[sourceStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return; // Invalid transition — dont do anything
    }

    // Optimistic update
    const newPipeline = { ...pipeline };
    newPipeline[sourceStatus] = (newPipeline[sourceStatus] || []).filter(l => l.id !== activeLead.id);
    const updatedLead = { ...activeLead, status: targetStatus };
    newPipeline[targetStatus] = [...(newPipeline[targetStatus] || []), updatedLead];
    setPipeline(newPipeline);

    // API call
    try {
      await api.updateLead(token, activeLead.id, { status: targetStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
      loadPipeline(); // Revert on error
    }
  };

  if (loading) return <div className="empty-state"><RefreshCw className="animate-spin" /><p>Loading pipeline...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Lead Pipeline</h1>
          <p className="page-description">Drag leads between stages to update their lifecycle status</p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="pipeline-container">
          {LIFECYCLE_STAGES.map(stage => (
            <DroppableColumn
              key={stage.key}
              stageKey={stage.key}
              label={stage.label}
              color={stage.color}
              leads={pipeline[stage.key] || []}
              onSelectLead={onSelectLead}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="pipeline-card drag-overlay">
              <div className="pipeline-card-name">{activeLead.firstName} {activeLead.lastName}</div>
              <div className="pipeline-card-meta">
                {activeLead.source && <span className="pipeline-card-tag tag-source">{activeLead.source.replace(/_/g, ' ')}</span>}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
