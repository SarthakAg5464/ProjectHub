"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';

export default function FacultyDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [endorsements, setEndorsements] = useState<any[]>([]);

  useEffect(() => {
    async function loadFacultyData() {
      if (!user) {
        if (!authLoading) router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'faculty') {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('endorsements')
        .select(`
          id, note, created_at,
          projects ( id, title, type, description )
        `)
        .eq('faculty_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setEndorsements(data);
      }

      setLoading(false);
    }

    if (!authLoading) {
      loadFacultyData();
    }
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading endorsements...</div>;
  }

  return (
    <main className="main-content animate-fade-in" style={{ paddingTop: '100px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(168, 85, 247, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)' }}>
          <Award size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Faculty Endorsements</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track the student projects you have publicly guided and supported.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {endorsements.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            You haven't endorsed any student projects yet.
          </div>
        ) : (
          endorsements.map(e => (
            <div key={e.id} className="glass-panel" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>{e.projects?.type}</div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{e.projects?.title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{e.projects?.description}</p>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-hover)', padding: '6px 12px', borderRadius: '20px' }}>
                  Endorsed on {new Date(e.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.05)', padding: '24px', borderRadius: '12px', borderLeft: '4px solid var(--accent-secondary)', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} /> Your Public Endorsement
                </div>
                <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6 }}>"{e.note}"</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link href={`/projects/${e.projects?.id}`}>
                  <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
                    View Project <ChevronRight size={16} />
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
