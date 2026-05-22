"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ManageProject({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [project, setProject] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");
  const [postingMilestone, setPostingMilestone] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!projectData || projectData.founder_id !== session.user.id) {
        router.push('/dashboard');
        return;
      }
      
      setProject(projectData);

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          id, pitch, status, created_at,
          users ( full_name, avatar_url, university, bio, user_skills(skill_name) )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (appsData) {
        setApplications(appsData);
      }

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (milestonesData) {
        setMilestones(milestonesData);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [id, router]);

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', appId);
      
    if (!error) {
      setApplications(applications.map(app => app.id === appId ? { ...app, status: newStatus } : app));
    }
  };

  const handlePostMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingMilestone(true);
    const { data, error } = await supabase
      .from('milestones')
      .insert({ project_id: id, title: milestoneTitle, description: milestoneDesc })
      .select()
      .single();
    
    if (data) {
      setMilestones([data, ...milestones]);
      setMilestoneTitle("");
      setMilestoneDesc("");
    } else if (error) {
      alert(error.message);
    }
    setPostingMilestone(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading inbox...</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '1000px', paddingTop: '100px' }}>
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{project.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your team and track your progress.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* Applications Section */}
        <div>
          {applications.filter(a => a.status === 'Accepted').length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: '#34D399' }}>Active Roster</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.filter(a => a.status === 'Accepted').map(app => (
                  <div key={app.id} className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img 
                          src={app.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                          alt={app.users?.full_name}
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                        <div>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{app.users?.full_name}</h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.users?.university}</div>
                        </div>
                      </div>
                      <button onClick={() => updateStatus(app.id, 'Removed')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#F87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Pending Requests</h2>
          {applications.filter(a => a.status === 'Pending').length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>No new applications.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {applications.filter(a => a.status === 'Pending').map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img 
                        src={app.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                        alt={app.users?.full_name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{app.users?.full_name}</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{app.users?.university}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> Application Pitch
                    </div>
                    <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>"{app.pitch}"</p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div className="skills-list" style={{ paddingTop: 0 }}>
                      {app.users?.user_skills?.map((skill: any) => (
                        <span key={skill.skill_name} className="skill-badge">{skill.skill_name}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <button onClick={() => updateStatus(app.id, 'Accepted')} className="btn-primary" style={{ flex: 1, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => updateStatus(app.id, 'Declined')} className="btn-secondary" style={{ flex: 1, color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones Section */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>BuildTrack</h2>
          
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Post New Milestone</h3>
            <form onSubmit={handlePostMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                required 
                className="search-input" 
                placeholder="e.g. Database Designed"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
              <textarea 
                required 
                className="search-input" 
                placeholder="What did the team accomplish?"
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
              />
              <button type="submit" disabled={postingMilestone} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} /> {postingMilestone ? 'Posting...' : 'Post Update to Public Timeline'}
              </button>
            </form>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Past Milestones</h3>
          {milestones.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No milestones posted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {milestones.map(m => (
                <div key={m.id} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{m.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{m.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
