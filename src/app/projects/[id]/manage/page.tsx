"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Check, X, Clock, Plus, GitBranch } from 'lucide-react';
import BackButton from '../../../../components/BackButton';
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
  const [milestoneDue, setMilestoneDue] = useState("");
  const [milestoneAssigned, setMilestoneAssigned] = useState("");
  const [postingMilestone, setPostingMilestone] = useState(false);

  const [githubUrl, setGithubUrl] = useState("");
  const [savingGithub, setSavingGithub] = useState(false);

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
      setGithubUrl(projectData.github_url || "");

      const { data: appsData } = await supabase
        .from('applications')
        .select(`
          id, pitch, status, created_at, applicant_id,
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

    const payload = JSON.stringify({
      desc: milestoneDesc,
      due: milestoneDue,
      assigned: milestoneAssigned
    });

    const { data, error } = await supabase
      .from('milestones')
      .insert({ project_id: id, title: milestoneTitle, description: payload })
      .select()
      .single();
    
    if (data) {
      setMilestones([data, ...milestones]);
      setMilestoneTitle("");
      setMilestoneDesc("");
      setMilestoneDue("");
      setMilestoneAssigned("");
    } else if (error) {
      alert(error.message);
    }
    setPostingMilestone(false);
  };

  const handleCompleteMilestone = async (milestoneId: string, currentDesc: string) => {
    let details = { desc: currentDesc, due: '', assigned: '', completed: false };
    try {
      const parsed = JSON.parse(currentDesc);
      if (parsed.desc !== undefined) details = { ...parsed };
    } catch (e) {}

    const newPayload = JSON.stringify({ ...details, completed: true });

    const { error } = await supabase
      .from('milestones')
      .update({ description: newPayload })
      .eq('id', milestoneId);

    if (!error) {
      setMilestones(milestones.map(m => m.id === milestoneId ? { ...m, description: newPayload } : m));
    }
  };

  const handleSaveGithub = async () => {
    setSavingGithub(true);
    const { error } = await supabase
      .from('projects')
      .update({ github_url: githubUrl.trim() === "" ? null : githubUrl.trim() })
      .eq('id', id);
      
    if (!error) {
      setProject({ ...project, github_url: githubUrl.trim() });
    }
    setSavingGithub(false);
  };

  if (loading) {
    return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Loading inbox...</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '1000px' }}>
      <BackButton href="/dashboard" text="Back to Dashboard" />
      
      <div className="mb-4">
        <h1 className="mb-1" style={{ fontSize: '2.5rem' }}>{project.title}</h1>
        <p className="text-muted">Manage your team and track your progress.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        
        <div>
          {applications.filter(a => a.status === 'Accepted').length > 0 && (
            <div className="mb-4">
              <h2 className="mb-3" style={{ fontSize: '1.5rem', color: '#34D399' }}>Active Roster</h2>
              <div className="flex-col gap-2">
                {applications.filter(a => a.status === 'Accepted').map(app => {
                  const applicant = Array.isArray(app.users) ? app.users[0] : app.users;
                  return (
                    <div key={app.id} className="glass-panel p-2" style={{ borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                      <div className="flex-between">
                        <Link href={`/profile/${app.applicant_id}`}>
                          <div className="flex-center gap-2" style={{ cursor: 'pointer', justifyContent: 'flex-start' }}>
                            <img 
                              src={applicant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                              alt={applicant?.full_name || 'Anonymous'}
                              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                            />
                            <div>
                              <h3 className="mb-0" style={{ fontSize: '1.1rem' }}>{applicant?.full_name || 'Anonymous'}</h3>
                              <div className="text-sm text-muted">{applicant?.university || 'University not specified'}</div>
                            </div>
                          </div>
                        </Link>
                        <button onClick={() => updateStatus(app.id, 'Removed')} className="btn-secondary text-sm" style={{ padding: '6px 12px', color: '#F87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="mb-3" style={{ fontSize: '1.5rem' }}>Pending Requests</h2>
          {applications.filter(a => a.status === 'Pending').length === 0 ? (
            <div className="glass-panel p-4 text-center text-muted">
              <p>No new applications.</p>
            </div>
          ) : (
            <div className="flex-col gap-3">
              {applications.filter(a => a.status === 'Pending').map(app => {
                const applicant = Array.isArray(app.users) ? app.users[0] : app.users;
                return (
                  <div key={app.id} className="glass-panel p-3">
                    <div className="flex-between mb-2 align-start" style={{ alignItems: 'flex-start' }}>
                      <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                        <Link href={`/profile/${app.applicant_id}`}>
                          <img 
                            src={applicant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                            alt={applicant?.full_name || 'Anonymous'}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer' }}
                          />
                        </Link>
                        <div>
                          <Link href={`/profile/${app.applicant_id}`}>
                            <h3 className="mb-0" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>{applicant?.full_name || 'Anonymous'}</h3>
                          </Link>
                          <div className="text-sm text-muted">{applicant?.university || 'University not specified'}</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted">
                        {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>

                  <div className="mb-2 p-2" style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                    <div className="flex-center gap-1 text-sm text-muted mb-1" style={{ justifyContent: 'flex-start' }}>
                      <Clock size={14} /> Application Pitch
                    </div>
                    <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>"{app.pitch}"</p>
                  </div>

                  <div className="mb-3">
                    <div className="skills-list" style={{ paddingTop: 0 }}>
                      {applicant?.user_skills?.map((skill: any) => (
                        <span key={skill.skill_name} className="skill-badge">{skill.skill_name}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex-center gap-1" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <button onClick={() => updateStatus(app.id, 'Accepted')} className="btn-primary flex-center gap-1 flex-1 text-sm" style={{ background: '#10B981' }}>
                      <Check size={16} /> Accept
                    </button>
                    <button onClick={() => updateStatus(app.id, 'Declined')} className="btn-secondary" style={{ flex: 1, color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.9rem' }}>
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        
        <div>
          <h2 className="mb-3" style={{ fontSize: '1.5rem' }}>Integrations</h2>
          <div className="glass-panel p-3 mb-4">
            <div className="flex-center gap-1 mb-2" style={{ justifyContent: 'flex-start' }}>
              <GitBranch size={20} />
              <h3 className="mb-0" style={{ fontSize: '1.1rem' }}>GitHub Repository</h3>
            </div>
            <p className="text-sm text-muted mb-2">Link your repository to display a live commit feed on your project page.</p>
            <div className="flex-center gap-1">
              <input 
                type="url" 
                placeholder="https://github.com/username/repo" 
                className="search-input" 
                style={{ flex: 1, padding: '10px 16px' }}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <button 
                className="btn-primary" 
                onClick={handleSaveGithub}
                disabled={savingGithub || githubUrl === project.github_url}
              >
                {savingGithub ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <h2 className="mb-3" style={{ fontSize: '1.5rem' }}>BuildTrack</h2>
          
          <div className="glass-panel p-3 mb-4">
            <h3 className="mb-2" style={{ fontSize: '1.1rem' }}>Post New Milestone</h3>
            <form onSubmit={handlePostMilestone} className="flex-col gap-2">
              <input 
                type="text" 
                required 
                className="search-input" 
                placeholder="e.g. Database Designed"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input 
                  type="date" 
                  className="search-input" 
                  style={{ padding: '12px 16px' }}
                  value={milestoneDue}
                  onChange={(e) => setMilestoneDue(e.target.value)}
                />
                <select 
                  className="search-input" 
                  style={{ padding: '12px 16px', appearance: 'none' }}
                  value={milestoneAssigned}
                  onChange={(e) => setMilestoneAssigned(e.target.value)}
                >
                  <option value="">Assign to (Optional)</option>
                  <option value={project.founder_id}>Myself (Founder)</option>
                  {applications.filter(a => a.status === 'Accepted').map(a => {
                    const applicant = Array.isArray(a.users) ? a.users[0] : a.users;
                    return (
                      <option key={a.applicant_id} value={a.applicant_id}>
                        {applicant?.full_name || 'Anonymous'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <textarea 
                required 
                className="search-input" 
                placeholder="What is the goal of this milestone?"
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
              />
              <button type="submit" disabled={postingMilestone} className="btn-primary flex-center gap-1">
                <Plus size={16} /> {postingMilestone ? 'Posting...' : 'Post Update to Public Timeline'}
              </button>
            </form>
          </div>

          <h3 className="mb-2" style={{ fontSize: '1.1rem' }}>Past Milestones</h3>
          {milestones.length === 0 ? (
            <div className="p-3 text-center text-muted">
              No milestones posted yet.
            </div>
          ) : (
            <div className="flex-col gap-2">
              {milestones.map(m => {
                let details: any = { desc: m.description, due: '', assigned: '', completed: false };
                try {
                  const parsed = JSON.parse(m.description);
                  if (parsed.desc !== undefined) details = parsed;
                } catch (e) {}

                let assignedName = '';
                if (details.assigned) {
                  if (details.assigned === project.founder_id) assignedName = 'Founder';
                  else {
                    const assignedApp = applications.find(a => a.applicant_id === details.assigned);
                    const appUser = assignedApp ? (Array.isArray(assignedApp.users) ? assignedApp.users[0] : assignedApp.users) : null;
                    assignedName = appUser?.full_name || 'Team Member';
                  }
                }

                return (
                  <div key={m.id} className="glass-panel p-3">
                    <div className="flex-between mb-1">
                      <h4 className="mb-0" style={{ fontSize: '1.1rem' }}>{m.title}</h4>
                      <div className="text-sm text-muted">
                        Added {new Date(m.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-muted mb-2" style={{ fontSize: '0.95rem' }}>{details.desc}</p>
                    
                    {(details.due || assignedName || details.completed) && (
                      <div className="flex-center gap-2 text-sm text-muted pt-2" style={{ borderTop: '1px solid var(--border-color)', justifyContent: 'flex-start' }}>
                        {details.due && (
                          <div className="flex-center gap-1">
                            <Clock size={14} color="#F59E0B" /> Due: {new Date(details.due).toLocaleDateString()}
                          </div>
                        )}
                        {assignedName && (
                          <div className="flex-center gap-1">
                            <Check size={14} color="#10B981" /> Assigned to: {assignedName}
                          </div>
                        )}
                        <div style={{ marginLeft: 'auto' }}>
                          {details.completed ? (
                            <span className="flex-center gap-1 text-bold" style={{ color: '#10B981' }}>
                              <Check size={14} /> Completed
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleCompleteMilestone(m.id, m.description)}
                              className="btn-secondary text-sm" 
                              style={{ padding: '4px 12px' }}
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
