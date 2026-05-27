"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Code, Clock, Users as UsersIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadDashboard() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, applications ( status )')
        .eq('founder_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        const formattedProjects = projectsData.map(p => ({
          ...p,
          pendingCount: p.applications?.filter((a: any) => a.status === 'Pending').length || 0
        }));
        setMyProjects(formattedProjects);
      }

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          id, status, created_at,
          projects ( id, title, type )
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (appsData) setMyApplications(appsData);

      setLoading(false);
    }
    
    if (!authLoading) {
      loadDashboard();
    }
  }, [router, user, authLoading]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;
  }

  const activeTeams = myApplications.filter(app => app.status === 'Accepted');
  const otherApps = myApplications.filter(app => app.status !== 'Accepted');

  return (
    <main className="main-content" style={{ maxWidth: '1000px', paddingTop: '100px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Manage the projects you lead and track your applications.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem' }}>My Projects</h2>
            <Link href="/post"><button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>+ New</button></Link>
          </div>
          
          {myProjects.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'var(--bg-surface-hover)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <Code size={24} />
              </div>
              <p>You haven't posted any projects yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {myProjects.map(project => (
                <div key={project.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="project-type" style={{ marginBottom: '4px' }}>{project.status}</div>
                      <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {project.title}
                        {project.pendingCount > 0 && (
                          <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {project.pendingCount} New
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><UsersIcon size={14} /> {project.team_size}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {project.commitment}</span>
                  </div>
                  <Link href={`/projects/${project.id}/manage`} style={{ width: '100%' }}>
                    <button className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px' }}>
                      Manage <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#34D399' }}>My Active Teams</h2>
          {activeTeams.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px', borderColor: 'rgba(52, 211, 153, 0.1)' }}>
              <p>You haven't joined any active teams yet.</p>
            </div>
          ) : (
            <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTeams.map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{app.projects?.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Joined {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/projects/${app.projects?.id}`} style={{ width: '100%' }}>
                    <button className="btn-secondary" style={{ width: '100%', padding: '8px' }}>Go to Project Board</button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Pending Applications</h2>
          
          {otherApps.length === 0 ? (
            <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No pending applications.</p>
              <Link href="/"><button className="btn-secondary" style={{ marginTop: '16px' }}>Explore IdeaBoard</button></Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {otherApps.map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{app.projects?.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 500,
                    background: app.status === 'Declined' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    color: app.status === 'Declined' ? '#F87171' : '#818CF8'
                  }}>
                    {app.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}
