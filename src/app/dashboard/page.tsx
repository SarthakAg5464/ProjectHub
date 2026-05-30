"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Code, Clock, Users as UsersIcon, ChevronRight, Compass, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'Open': return 'badge badge-indigo';
    case 'Active': return 'badge badge-success';
    case 'Completed': return 'badge badge-purple';
    default: return 'badge badge-indigo';
  }
};

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
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid var(--border-subtle)',
            borderTopColor: 'var(--accent-indigo)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            Loading Dashboard...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const activeTeams = myApplications.filter(app => app.status === 'Accepted');
  const otherApps = myApplications.filter(app => app.status !== 'Accepted');

  return (
    <main className="main-content" style={{ maxWidth: '1000px' }}>
      <div>
        <h1 className="section-title" style={{ marginBottom: '8px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 400 }}>
          Manage the projects you lead and track your applications.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.3px'
            }}>My Projects</h2>
            <Link href="/post">
              <button className="btn-glow" style={{ padding: '8px 18px', minHeight: '44px', fontSize: '0.85rem' }}>
                + New Project
              </button>
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <div className="glass-card" style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <Code size={28} style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                marginBottom: '20px'
              }}>You haven&apos;t posted any projects yet.</p>
              <Link href="/post">
                <button className="btn-glow" style={{ minHeight: '44px', padding: '10px 28px' }}>
                  Create Your First Project
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myProjects.map(project => (
                <div key={project.id} className="glass-card glow-border" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={statusBadgeClass(project.status)}>
                          {project.status}
                        </span>
                        {project.pendingCount > 0 && (
                          <span style={{
                            background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))',
                            color: 'white',
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.2)',
                            animation: 'pulseGlow 2s ease-in-out infinite'
                          }}>
                            {project.pendingCount} New
                          </span>
                        )}
                      </div>
                      <h3 style={{
                        fontSize: '1.15rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        margin: 0,
                        lineHeight: 1.3
                      }}>
                        {project.title}
                      </h3>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UsersIcon size={14} /> {project.team_size}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} /> {project.commitment}
                    </span>
                  </div>
                  <Link href={`/projects/${project.id}/manage`} style={{ width: '100%' }}>
                    <button className="btn-ghost" style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minHeight: '44px'
                    }}>
                      Manage <ChevronRight size={15} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: 'var(--accent-emerald)'
          }}>My Active Teams</h2>

          {activeTeams.length === 0 ? (
            <div className="glass-card" style={{
              padding: '36px 24px',
              textAlign: 'center',
              borderColor: 'rgba(16, 185, 129, 0.15)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <UsersIcon size={24} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                marginBottom: '16px'
              }}>You haven&apos;t joined any active teams yet.</p>
              <Link href="/">
                <button className="btn-ghost" style={{ minHeight: '44px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={15} /> Explore Projects
                  </span>
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTeams.map(app => (
                <div key={app.id} className="glass-card" style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderLeft: '3px solid #10b981'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: '4px'
                    }}>{app.projects?.title}</h3>
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)'
                    }}>Joined {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link href={`/projects/${app.projects?.id}`} style={{ width: '100%' }}>
                    <button className="btn-ghost" style={{
                      width: '100%',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      Go to Project Board <ChevronRight size={15} />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <h2 style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
            marginTop: '12px'
          }}>Pending Applications</h2>

          {otherApps.length === 0 ? (
            <div className="glass-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <Send size={22} style={{ color: 'var(--accent-indigo)' }} />
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                marginBottom: '16px'
              }}>No pending applications.</p>
              <Link href="/">
                <button className="btn-glow" style={{ minHeight: '44px', padding: '10px 28px' }}>
                  Explore IdeaBoard
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {otherApps.map(app => (
                <div key={app.id} className="glass-card" style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: '4px'
                    }}>{app.projects?.title}</h3>
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)'
                    }}>Applied {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: app.status === 'Declined' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    color: app.status === 'Declined' ? '#F87171' : '#818CF8',
                    border: `1px solid ${app.status === 'Declined' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
                    whiteSpace: 'nowrap' as const
                  }}>
                    {app.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.2); }
          50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.3); }
        }
      `}</style>
    </main>
  );
}
