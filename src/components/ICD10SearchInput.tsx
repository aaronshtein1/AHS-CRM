'use client';

import { useState, useRef, useEffect } from 'react';
import { TOP_75_ICD10_CODES, ICD10Code } from '@/lib/icd10Data';
import { Search, X, Check } from 'lucide-react';

interface ICD10SearchInputProps {
  value?: string;
  onSave: (field: string, value: string) => void;
}

export default function ICD10SearchInput({ value = '', onSave }: ICD10SearchInputProps) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCodes = TOP_75_ICD10_CODES.filter(item => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.code.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: ICD10Code) => {
    const formattedVal = `[${item.code}] ${item.description}`;
    setQuery(formattedVal);
    onSave('diagnosis', formattedVal);
    setIsOpen(false);
    setEditing(false);
  };

  const handleCustomSave = () => {
    onSave('diagnosis', query);
    setIsOpen(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="editable-field" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <span className="editable-label">Diagnosis (ICD-10)</span>
        <span className="editable-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {query ? (
            <span style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 13 }}>
              {query}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Click to select ICD-10 diagnosis...</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="editable-field editing" ref={containerRef} style={{ position: 'relative' }}>
      <span className="editable-label">Diagnosis (ICD-10 Search)</span>
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input form-input-sm"
              style={{ width: '100%', paddingRight: 28 }}
              placeholder="Type ICD-10 code (e.g. S06) or diagnosis name (e.g. TBI)..."
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              autoFocus
            />
            <Search size={14} style={{ position: 'absolute', right: 8, top: 8, color: 'var(--text-muted)' }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleCustomSave} title="Save text">
            <Check size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setIsOpen(false); }}>
            <X size={14} />
          </button>
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              maxHeight: 240,
              overflowY: 'auto',
              background: 'var(--surface-raised, #1e293b)',
              border: '1px solid var(--border, #334155)',
              borderRadius: 8,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 100
            }}
          >
            <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              TOP 75 ICD-10 DIAGNOSES ({filteredCodes.length} matches)
            </div>
            {filteredCodes.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No standard ICD-10 code found. Click <strong>✓</strong> to save custom text &quot;{query}&quot;.
              </div>
            ) : (
              filteredCodes.map(item => (
                <div
                  key={item.code}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 12,
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                  className="icd10-option"
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>{item.code}</span>
                    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12 }}>{item.description}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
