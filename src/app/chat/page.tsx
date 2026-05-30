"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import Link from 'next/link';
import { MessageSquare, ChevronRight } from 'lucide-react';

export default function ChatHub() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);

  useEffect(() => {
    async function loadChats() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data: myProjects } = await supabase
        .from('projects')
        .select('id, title')
        .eq('founder_id', user.id);

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          projects!applications_project_id_fkey ( id, title )
        `)
        .eq('applicant_id', user.id)
        .eq('status', 'Accepted');

      let projectsMap = new Map();
      
      if (myProjects) {
        myProjects.forEach(p => projectsMap.set(p.id, p));
      }
      
      if (appsData) {
        appsData.forEach((a: any) => {
          if (a.projects) {
            projectsMap.set(a.projects.id, a.projects);
          }
        });
      }

      const allProjects = Array.from(projectsMap.values());
      
      if (allProjects.length > 0) {
        const allProjIds = allProjects.map((p: any) => p.id);
        const { data: receipts } = await supabase
          .from('chat_read_receipts')
          .select('project_id, last_read_at')
          .eq('user_id', user.id)
          .in('project_id', allProjIds);
          
        const receiptsMap = new Map();
        if (receipts) {
          receipts.forEach(r => receiptsMap.set(r.project_id, r.last_read_at));
        }

        for (const proj of allProjects as any[]) {
          const lastRead = receiptsMap.get(proj.id);
          let query = supabase.from('messages').select('*', { count: 'exact', head: true }).eq('project_id', proj.id);
          if (lastRead) {
            query = query.gt('created_at', lastRead);
          }
          const { count } = await query;
          proj.unreadCount = count || 0;
        }
      }

      setActiveProjects(allProjects);

      setLoading(false);
    }
    
    if (!authLoading) {
      loadChats();
    }
  }, [user, authLoading, router]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading your chat directory...</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '100px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Chat Menu</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Select a project team to open the secure chat workspace.</p>
      </div>

      {activeProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <MessageSquare size={32} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <p>You aren't in any active project teams yet.</p>
          <Link href="/">
            <button className="btn-primary" style={{ marginTop: '24px' }}>Browse Projects</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeProjects.map(project => (
            <Link key={project.id} href={`/projects/${project.id}/chat`}>
              <div 
                className="glass-panel hover-scale" 
                style={{ 
                  padding: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'var(--bg-surface-hover)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}>
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {project.title}
                      {project.unreadCount > 0 && (
                        <span style={{ fontSize: '0.75rem', background: '#F87171', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {project.unreadCount} New
                        </span>
                      )}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tap to open team chat</p>
                  </div>
                </div>
                <ChevronRight size={20} color="var(--text-secondary)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
