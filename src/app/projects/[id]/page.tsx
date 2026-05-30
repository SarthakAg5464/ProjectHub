"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Users, GitBranch, GitCommit, Award, ChevronLeft, Calendar, Rocket, Sparkles, Send, ExternalLink, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pitch, setPitch] = useState("");
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applicationFeedback, setApplicationFeedback] = useState<string | null>(null);
  const [isAcceptedMember, setIsAcceptedMember] = useState(false);
  const [showPitchForm, setShowPitchForm] = useState(false);
  const [commits, setCommits] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [userRole, setUserRole] = useState("student");
  const [endorsementNote, setEndorsementNote] = useState("");
  const [endorsing, setEndorsing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setUser(session.user);

      const { data: projectData } = await supabase
        .from('projects')
        .select(`
          *,
          users!projects_founder_id_fkey ( full_name, avatar_url, university, bio ),
          project_skills!project_skills_project_id_fkey ( skill_name )
        `)
        .eq('id', id)
        .single();
        
      if (projectData) {
        setProject(projectData);
        
        if (session) {
          const { data: appData } = await supabase
            .from('applications')
            .select('id, status, feedback')
            .eq('project_id', id)
            .eq('applicant_id', session.user.id)
            .single();
            
          if (appData) {
            setHasApplied(true);
            setApplicationStatus(appData.status);
            if (appData.feedback) setApplicationFeedback(appData.feedback);
            if (appData.status === 'Accepted') setIsAcceptedMember(true);
          }

          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (profile) setUserRole(profile.role);
        }
        
        if (projectData.github_url) {
          try {
            const urlObj = new URL(projectData.github_url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
              const owner = pathParts[0];
              const repo = pathParts[1];
              const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=3`);
              if (res.ok) {
                const data = await res.json();
                setCommits(data);
              }
            }
          } catch (e) {
            console.error("Failed to fetch github commits");
          }
        }
      }

      const { data: membersData } = await supabase
        .from('applications')
        .select(`applicant_id, users!applications_applicant_id_fkey ( full_name, avatar_url, university )`)
        .eq('project_id', id)
        .eq('status', 'Accepted');

      if (membersData) {
        setTeamMembers(membersData);
      }

      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (milestonesData) {
        setMilestones(milestonesData);
      }

      const { data: endorsementsData } = await supabase
        .from('endorsements')
        .select(`id, note, created_at, users!endorsements_faculty_id_fkey ( full_name, avatar_url, university )`)
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (endorsementsData) {
        setEndorsements(endorsementsData);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [id]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setApplying(true);
    
    const { error } = await supabase
      .from('applications')
      .insert({
        project_id: id,
        applicant_id: user.id,
        pitch: pitch,
        status: 'Pending'
      });
      
    if (error) {
      alert(error.message);
    } else {
      setHasApplied(true);
      setShowPitchForm(false);
    }
    
    setApplying(false);
  };

  const handleWithdraw = async () => {
    if (!user) return;
    setApplying(true);
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('project_id', id)
      .eq('applicant_id', user.id);
      
    if (!error) {
      setHasApplied(false);
      setApplicationStatus(null);
      setApplicationFeedback(null);
      setShowPitchForm(false);
      setPitch("");
    }
    setApplying(false);
  };

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || userRole !== 'faculty') return;
    
    setEndorsing(true);
    const { data } = await supabase
      .from('endorsements')
      .insert({
        project_id: id,
        faculty_id: user.id,
        note: endorsementNote
      })
      .select(`id, note, created_at, users ( full_name, avatar_url, university )`)
      .single();
      
    if (data) {
      setEndorsements([data, ...endorsements]);
      setEndorsementNote("");
    }
    setEndorsing(false);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-indigo)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            Loading project blueprint...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="flex-center" style={{ minHeight: '60vh', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Project not found.</div>;
  }

  const isFounder = user?.id === project.founder_id;

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 16px 40px' }}>
      <style>{`
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .bento-item {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }
        .bento-header { grid-column: span 12; position: relative; overflow: hidden; }
        .bento-main { grid-column: span 8; display: flex; flex-direction: column; gap: 32px; }
        .bento-sidebar { grid-column: span 4; display: flex; flex-direction: column; gap: 24px; position: sticky; top: 96px; align-self: start; }
        
        @media (max-width: 900px) {
          .bento-main, .bento-sidebar { grid-column: span 12; }
          .bento-sidebar { order: -1; } /* Bring actions to top on mobile */
        }
        
        .hero-glow {
          position: absolute;
          top: -50px;
          right: -50px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%);
          filter: blur(40px);
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <ChevronLeft size={18} /> Back to IdeaBoard
        </Link>
      </div>

      <div className="bento-grid">
        
        {/* Header Block */}
        <div className="bento-item bento-header" style={{ padding: '48px 32px', border: '1px solid rgba(99,102,241,0.3)' }}>
          <div className="hero-glow"></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span className="badge badge-indigo" style={{ padding: '6px 16px', fontSize: '0.85rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', backdropFilter: 'blur(10px)' }}>{project.type}</span>
              <span className="badge badge-indigo" style={{ padding: '6px 16px', fontSize: '0.85rem', background: 'rgba(168,85,247,0.15)', color: 'var(--accent-violet)', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(10px)' }}>{project.stage} Stage</span>
            </div>
            
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 800, margin: '0 0 24px 0', lineHeight: 1.1, letterSpacing: '-1px', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 8px 32px rgba(99,102,241,0.3)' }}>
              {project.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500 }}>
                <Users size={20} color="var(--accent-indigo)" />
                Team of {project.team_size}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500 }}>
                <Clock size={20} color="var(--accent-indigo)" />
                {project.commitment}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '1.05rem', fontWeight: 500 }}>
                <Calendar size={20} color="var(--accent-indigo)" />
                Started {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div className="bento-main">
          
          <div className="bento-item">
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={22} color="var(--accent-indigo)" /> Project Vision
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.8, margin: 0 }}>
              {project.description}
            </p>
          </div>

          <div className="bento-item">
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Rocket size={22} color="var(--accent-emerald)" /> Required Tech Stack
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {project.project_skills?.length > 0 ? project.project_skills.map((skill: any) => (
                <span key={skill.skill_name} style={{ 
                  fontSize: '0.95rem', padding: '8px 18px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                  border: '1px solid rgba(16,185,129,0.2)', color: 'var(--accent-emerald)', fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
                }}>
                  {skill.skill_name}
                </span>
              )) : (
                <span style={{ color: 'var(--text-secondary)' }}>No specific skills listed.</span>
              )}
            </div>
          </div>

          {project.github_url && (
            <div className="bento-item" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(99,102,241,0.03) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                    <GitBranch size={20} color="#fff" />
                  </div>
                  Live Repository
                </h3>
                <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  View on GitHub <ExternalLink size={16} />
                </a>
              </div>
              
              {commits.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                  No recent commits found or repository is private.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {commits.map((commit: any, idx: number) => (
                    <div key={idx} style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: '16px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'} onClick={() => window.open(commit.html_url, '_blank')}>
                      <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <GitCommit size={20} color="var(--accent-indigo)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commit.commit.message.split('\n')[0]}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>{commit.commit.author.name}</span>
                          <span style={{ opacity: 0.3 }}>•</span>
                          <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        {commit.sha.substring(0, 7)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {milestones.length > 0 && (
            <div className="bento-item">
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ActivityIcon /> BuildTrack Timeline
              </h3>
              
              <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Vertical Dashed Line */}
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'repeating-linear-gradient(to bottom, rgba(99,102,241,0.3) 0, rgba(99,102,241,0.3) 6px, transparent 6px, transparent 12px)' }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {milestones.map((m) => {
                    let details: any = { desc: m.description, due: '', assigned: '', completed: false, completed_at: '' };
                    try {
                      const parsed = JSON.parse(m.description);
                      if (parsed.desc !== undefined) details = { ...details, ...parsed };
                    } catch (e) {}
                    
                    const isOverdue = !details.completed && details.due && new Date(details.due) < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <div key={m.id} style={{ position: 'relative', background: details.completed ? 'rgba(16,185,129,0.03)' : isOverdue ? 'rgba(248,113,113,0.03)' : 'var(--bg-elevated)', border: '1px solid', borderColor: details.completed ? 'rgba(16,185,129,0.3)' : isOverdue ? 'rgba(248,113,113,0.3)' : 'var(--border-subtle)', borderRadius: '16px', padding: '24px', transition: 'transform 0.2s', boxShadow: details.completed ? '0 8px 24px rgba(16,185,129,0.1)' : 'none' }}>
                        
                        {/* Timeline Node */}
                        <div style={{ position: 'absolute', left: '-40px', top: '32px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: details.completed ? 'var(--accent-emerald)' : isOverdue ? '#f87171' : 'var(--accent-indigo)', boxShadow: details.completed ? '0 0 12px rgba(16,185,129,0.8)' : isOverdue ? '0 0 12px rgba(248,113,113,0.8)' : '0 0 12px rgba(99,102,241,0.8)' }}></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{new Date(m.created_at).toLocaleDateString()}</span>
                          {details.due && <span style={{ fontSize: '0.85rem', color: isOverdue ? '#f87171' : 'var(--text-secondary)', fontWeight: 600 }}>• Due: {new Date(details.due).toLocaleDateString()}</span>}
                          
                          {details.completed && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              ✓ Completed {details.completed_at && `on ${new Date(details.completed_at).toLocaleDateString()}`}
                            </span>
                          )}
                          {isOverdue && <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '30px', background: 'rgba(248,113,113,0.1)', color: '#f87171', fontSize: '0.8rem', fontWeight: 700, border: '1px solid rgba(248,113,113,0.3)' }}>⚠️ Overdue</span>}
                        </div>
                        
                        <h4 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>{m.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '1rem', margin: 0 }}>{details.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sticky Sidebar */}
        <div className="bento-sidebar">
          
          {/* Actions Block */}
          {(isFounder || !(userRole === 'admin' || userRole === 'faculty')) && (
            <div className="bento-item" style={{ padding: '32px', background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-card) 100%)' }}>
              {isFounder ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                    <Crown size={32} color="var(--accent-indigo)" />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>You are the Founder</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>Manage your team, track milestones, and update repository settings.</p>
                  <Link href={`/projects/${project.id}/manage`}>
                    <button className="btn-glow" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700 }}>
                      Manage Project Hub
                    </button>
                  </Link>
                </div>
              ) : isAcceptedMember ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <Award size={32} color="var(--accent-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Active Member</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)', marginBottom: 0, fontWeight: 600 }}>You are officially on this team.</p>
              </div>
            ) : hasApplied ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-surface-hover)', border: '2px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <Send size={32} color="var(--text-secondary)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {applicationStatus === 'Declined' ? 'Not Selected' : applicationStatus === 'Removed' ? 'Removed from Team' : 'Application Sent'}
                </h3>
                <p style={{ fontSize: '0.95rem', color: applicationStatus === 'Declined' || applicationStatus === 'Removed' ? '#f87171' : 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500 }}>
                  {applicationStatus === 'Declined' ? 'Your application was not selected.' : applicationStatus === 'Removed' ? 'You have been removed from this team.' : 'Your application is pending review.'}
                </p>
                {applicationStatus === 'Declined' && (
                  <>
                    {applicationFeedback && (
                      <div style={{ padding: '16px', background: 'rgba(248,113,113,0.05)', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '20px', textAlign: 'left' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#F87171', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback from Founder</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>"{applicationFeedback}"</p>
                      </div>
                    )}
                    <button onClick={handleWithdraw} disabled={applying} className="btn-ghost" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)', color: 'var(--text-primary)' }}>
                      {applying ? 'Processing...' : 'Withdraw & Reapply'}
                    </button>
                  </>
                )}
              </div>
            ) : !showPitchForm ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 0 32px rgba(16,185,129,0.2)' }}>
                  <Users size={32} color="var(--accent-emerald)" />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Join the Mission</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>Think you have the skills? Pitch the founder to join this project.</p>
                <button
                  onClick={() => setShowPitchForm(true)}
                  className="btn-glow"
                  style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: '16px', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', border: 'none' }}
                >
                  Apply to Join Team
                </button>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Send size={20} /> Your Pitch
                </h3>
                <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <textarea
                    required
                    maxLength={300}
                    className="search-field"
                    placeholder="Why are you the perfect fit for this project? Keep it concise. (Max 300 char)"
                    style={{ minHeight: '140px', resize: 'vertical', borderRadius: '16px', padding: '16px', fontSize: '0.95rem', background: 'var(--bg-main)' }}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <span style={{ color: pitch.length > 280 ? '#f87171' : 'var(--text-secondary)' }}>{pitch.length}</span>/300
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setShowPitchForm(false)} className="btn-ghost" style={{ flex: 1, padding: '14px', borderRadius: '14px', fontWeight: 600 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={applying} className="btn-glow" style={{ flex: 2, padding: '14px', borderRadius: '14px', fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-emerald), #059669)', border: 'none' }}>
                      {applying ? 'Sending...' : 'Send Pitch'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

          {/* Active Team Block */}
          <div className="bento-item" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--accent-indigo)" /> Active Roster
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link href={`/profile/${project.founder_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`}
                      alt={project.users?.full_name}
                      style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '20px', height: '20px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Crown size={12} color="var(--accent-indigo)" />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{project.users?.full_name || 'Anonymous'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{project.users?.university}</div>
                  </div>
                </div>
              </Link>

              {teamMembers.map((member, index) => (
                <Link key={index} href={`/profile/${member.applicant_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border-subtle)', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                    <img
                      src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Anonymous')}&background=10B981&color=fff`}
                      alt={member.users?.full_name}
                      style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>{member.users?.full_name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{member.users?.university}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Endorsements Block */}
          {(endorsements.length > 0 || (userRole === 'faculty' && !isFounder)) && (
            <div className="bento-item" style={{ padding: '32px', background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(168,85,247,0.03) 100%)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="var(--accent-violet)" /> Endorsements
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {endorsements.map(e => (
                  <div key={e.id} style={{ position: 'relative', background: 'var(--bg-elevated)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '16px', padding: '24px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '6rem', color: 'rgba(168,85,247,0.05)', fontFamily: 'serif', lineHeight: 1, zIndex: 0 }}>"</div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 20px 0' }}>&ldquo;{e.note}&rdquo;</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={e.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.users?.full_name || 'Faculty')}&background=a855f7&color=fff`}
                          alt={e.users?.full_name}
                          style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{e.users?.full_name || 'Faculty Member'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{e.users?.university}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {userRole === 'faculty' && !isFounder && (
                <div style={{ marginTop: endorsements.length > 0 ? '32px' : '0' }}>
                  <div style={{ padding: '24px', background: 'rgba(168,85,247,0.05)', border: '1px dashed rgba(168,85,247,0.3)', borderRadius: '16px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-violet)', marginBottom: '12px' }}>Add Your Endorsement</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                      Your public support gives this student project massive credibility across campus.
                    </p>
                    <form onSubmit={handleEndorse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <textarea
                        required
                        maxLength={300}
                        className="search-field"
                        placeholder="Write a brief note of support or guidance..."
                        style={{ minHeight: '100px', resize: 'vertical', borderRadius: '12px', background: 'var(--bg-main)' }}
                        value={endorsementNote}
                        onChange={(e) => setEndorsementNote(e.target.value)}
                      />
                      <button type="submit" disabled={endorsing} className="btn-glow" style={{ background: 'linear-gradient(135deg, var(--accent-violet), #a855f7)', padding: '12px', borderRadius: '12px', fontWeight: 600 }}>
                        {endorsing ? 'Posting...' : 'Post Endorsement'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

// Activity Icon Component Helper
function ActivityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-indigo)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
