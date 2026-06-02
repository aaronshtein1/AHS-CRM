import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PerformanceReview({ token, onSelectLead }: { token: string; onSelectLead: (id: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPerformance(token).then(res => {
      setData(res);
      setLoading(false);
    }).catch(console.error);
  }, [token]);

  if (loading) return <div style={{ padding: 32 }}>Loading performance data...</div>;
  if (!data) return <div style={{ padding: 32 }}>Failed to load performance data.</div>;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="section-title">Performance Review</h1>
          <p style={{ color: 'var(--text-muted)' }}>Metrics tracked according to internal standards</p>
        </div>
        <div className="card" style={{ minWidth: 150, textAlign: 'center', padding: '16px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-blue)', marginTop: 4 }}>
            {data.summary.finalScore.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.1}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 600 }}>Bucket 1: New Leads</h3>
            <TrendingUp size={16} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Moves within a week at 60% conversion</p>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{data.bucket1.rate.toFixed(1)}%</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.bucket1.moved} / {data.bucket1.total} moved out of NEW</div>
          <div style={{ marginTop: 16, height: 8, borderRadius: 4, backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(data.bucket1.rate, 100)}%`, backgroundColor: data.bucket1.rate >= 60 ? 'var(--accent-green)' : 'var(--accent-red)' }}></div>
          </div>
        </motion.div>

        <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.2}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 600 }}>Bucket 2: 30-Day Retention</h3>
            <TrendingUp size={16} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Progresses and stays on service 30 days</p>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{data.bucket2.rate.toFixed(1)}%</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.bucket2.retained} / {data.bucket2.totalEligible} retained > 30 days</div>
          <div style={{ marginTop: 16, height: 8, borderRadius: 4, backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(data.bucket2.rate, 100)}%`, backgroundColor: 'var(--accent-blue)' }}></div>
          </div>
        </motion.div>

        <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.3}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 600 }}>Bucket 3: Medicaid Approvals</h3>
            <TrendingUp size={16} color="var(--text-muted)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Medicaid moves to approval</p>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>{data.bucket3.rate.toFixed(1)}%</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.bucket3.approved} / {data.bucket3.total} approved</div>
          <div style={{ marginTop: 16, height: 8, borderRadius: 4, backgroundColor: 'var(--border-color)', overflow: 'hidden' }}>
             <div style={{ height: '100%', width: `${Math.min(data.bucket3.rate, 100)}%`, backgroundColor: 'var(--accent-blue)' }}></div>
          </div>
        </motion.div>
      </div>

      <div className="grid-2">
        <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.4}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Bucket 4: Unqualified Audit</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Subjective review of lost leads</p>
            </div>
            <FileText size={20} color="var(--text-muted)" />
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Lost Reason</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.bucket4.leads.map((l: any) => (
                  <tr key={l.id}>
                    <td><button className="hover-underline" onClick={() => onSelectLead(l.id)} style={{background:'none', border:'none', padding:0, cursor:'pointer', color:'var(--text-primary)', fontWeight:500}}>{l.firstName} {l.lastName}</button></td>
                    <td>{l.lostReason || '-'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.notes || '-'}</td>
                  </tr>
                ))}
                {data.bucket4.leads.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>No unqualified leads found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: 0.5}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h3 className="section-title">Bucket 5: Volume Penalty</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>If below 30 total starts x .75</p>
            </div>
            <AlertCircle size={20} color={data.bucket5.penaltyApplied ? 'var(--accent-red)' : 'var(--accent-green)'} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: data.bucket5.penaltyApplied ? 'var(--accent-red)' : 'var(--accent-green)', marginBottom: 8 }}>
              {data.bucket5.currentMonthStarts}
            </div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 24, fontWeight: 500 }}>Current Month Starts</div>
            
            <div style={{ width: '100%', maxWidth: 250 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 600 }}>
                <span>0</span>
                <span>Target: 30</span>
              </div>
              <div style={{ height: 12, backgroundColor: 'var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((data.bucket5.currentMonthStarts / 30) * 100, 100)}%`, backgroundColor: data.bucket5.penaltyApplied ? 'var(--accent-red)' : 'var(--accent-green)' }}></div>
              </div>
            </div>

            {data.bucket5.penaltyApplied ? (
              <div style={{ marginTop: 24, padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, fontSize: 14 }}>
                <strong>Penalty Applied:</strong> Total score is multiplied by {data.bucket5.multiplier}.
              </div>
            ) : (
              <div style={{ marginTop: 24, padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 6, fontSize: 14 }}>
                <strong>Target Met:</strong> No volume penalty applied.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
