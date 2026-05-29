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
    return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Loading Dashboard...</div>;
  }

  const activeTeams = myApplications.filter(app => app.status === 'Accepted');
  const otherApps = myApplications.filter(app => app.status !== 'Accepted');

  return (
    <main className="main-content" style={{ maxWidth: '1000px' }}>
      <h1 className="mb-1" style={{ fontSize: '2.5rem' }}>Dashboard</h1>
      <p className="text-muted mb-4">Manage the projects you lead and track your applications.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        <div>
          <div className="flex-between mb-3">
            <h2 className="mb-0" style={{ fontSize: '1.5rem' }}>My Projects</h2>
            <Link href="/post"><button className="btn-primary text-sm" style={{ padding: '6px 12px' }}>+ New</button></Link>
          </div>
          
          {myProjects.length === 0 ? (
            <div className="glass-panel p-4 text-center text-muted">
              <div className="flex-center mb-2" style={{ background: 'var(--bg-surface-hover)', width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px auto', color: 'var(--text-secondary)' }}>
                <Code size={24} />
              </div>
              <p>You haven't posted any projects yet.</p>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {myProjects.map(project => (
                <div key={project.id} className="glass-panel p-3 flex-col gap-2">
                  <div className="flex-between align-start">
                    <div>
                      <div className="project-type mb-1">{project.status}</div>
                      <h3 className="mb-0 flex-center gap-1" style={{ fontSize: '1.1rem', justifyContent: 'flex-start' }}>
                        {project.title}
                        {project.pendingCount > 0 && (
                          <span className="text-sm text-bold" style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>
                            {project.pendingCount} New
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-center gap-2 text-sm text-muted" style={{ justifyContent: 'flex-start' }}>
                    <span className="flex-center gap-1"><UsersIcon size={14} /> {project.team_size}</span>
                    <span className="flex-center gap-1"><Clock size={14} /> {project.commitment}</span>
                  </div>
                  <Link href={`/projects/${project.id}/manage`} style={{ width: '100%' }}>
                    <button className="btn-secondary flex-center gap-1 p-2" style={{ width: '100%' }}>
                      Manage <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3" style={{ fontSize: '1.5rem', color: '#34D399' }}>My Active Teams</h2>
          {activeTeams.length === 0 ? (
            <div className="glass-panel p-3 text-center text-muted mb-4" style={{ borderColor: 'rgba(52, 211, 153, 0.1)' }}>
              <p>You haven't joined any active teams yet.</p>
            </div>
          ) : (
            <div className="flex-col gap-2 mb-4">
              {activeTeams.map(app => (
                <div key={app.id} className="glass-panel p-3 flex-col gap-2" style={{ borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  <div>
                    <h3 className="mb-1" style={{ fontSize: '1.1rem' }}>{app.projects?.title}</h3>
                    <p className="text-sm text-muted">Joined {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/projects/${app.projects?.id}`} style={{ width: '100%' }}>
                    <button className="btn-secondary p-2 text-center" style={{ width: '100%' }}>Go to Project Board</button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <h2 className="mb-3" style={{ fontSize: '1.5rem' }}>Pending Applications</h2>
          
          {otherApps.length === 0 ? (
            <div className="glass-panel p-4 text-center text-muted">
              <p>No pending applications.</p>
              <Link href="/"><button className="btn-secondary mt-2">Explore IdeaBoard</button></Link>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {otherApps.map(app => (
                <div key={app.id} className="glass-panel flex-between p-3">
                  <div>
                    <h3 className="mb-1" style={{ fontSize: '1.1rem' }}>{app.projects?.title}</h3>
                    <p className="text-sm text-muted">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm text-bold" style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
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
