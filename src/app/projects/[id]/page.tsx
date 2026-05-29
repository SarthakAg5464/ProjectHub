"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Users, GitBranch, GitCommit, Award } from 'lucide-react';
import BackButton from '../../../components/BackButton';
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
          users ( full_name, avatar_url, university, bio ),
          project_skills ( skill_name )
        `)
        .eq('id', id)
        .single();
        
      if (projectData) {
        setProject(projectData);
        
        if (session) {
          const { data: appData } = await supabase
            .from('applications')
            .select('id, status')
            .eq('project_id', id)
            .eq('applicant_id', session.user.id)
            .single();
            
          if (appData) {
            setHasApplied(true);
            setApplicationStatus(appData.status);
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
        .select(`applicant_id, users ( full_name, avatar_url, university )`)
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
        .select(`id, note, created_at, users ( full_name, avatar_url, university )`)
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
    return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Loading project details...</div>;
  }

  if (!project) {
    return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Project not found.</div>;
  }

  const isFounder = user?.id === project.founder_id;

  return (
    <main className="main-content" style={{ maxWidth: '800px' }}>
      <BackButton href="/" text="Back to IdeaBoard" />
      
      <div className="glass-panel p-4">
        {endorsements.length > 0 && (
          <div className="flex-center gap-1 mb-3 text-sm text-bold" style={{ display: 'inline-flex', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-secondary)', padding: '6px 12px', borderRadius: '30px' }}>
            <Award size={16} /> {endorsements.length} Faculty Endorsement{endorsements.length !== 1 ? 's' : ''}
          </div>
        )}
        <div className="mb-4">
          <div className="project-type mb-1">{project.type} • {project.stage}</div>
          <h1 className="mb-2" style={{ fontSize: '2.5rem' }}>{project.title}</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>{project.description}</p>
        </div>
        
        <div className="flex-center gap-3 mb-4 p-4" style={{ padding: '0 0 32px 0', borderBottom: '1px solid var(--border-color)', justifyContent: 'flex-start' }}>
          <div className="flex-center gap-1">
            <Users size={18} color="var(--text-secondary)" />
            <span>{project.team_size}</span>
          </div>
          <div className="flex-center gap-1">
            <Clock size={18} color="var(--text-secondary)" />
            <span>{project.commitment}</span>
          </div>
        </div>

        {project.github_url && (
          <div className="mb-4" style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
            <div className="flex-between mb-3">
              <div className="flex-center gap-2">
                <GitBranch size={24} />
                <h3 style={{ fontSize: '1.25rem' }}>GitHub Activity</h3>
              </div>
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm" style={{ padding: '8px 16px' }}>
                View Repository
              </a>
            </div>
            
            {commits.length === 0 ? (
              <div className="p-3 text-center text-muted" style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                No recent commits found or repository is private.
              </div>
            ) : (
              <div className="flex-col gap-2">
                {commits.map((commit: any, idx: number) => (
                  <div key={idx} className="flex-center gap-2 p-2 align-start" style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px', alignItems: 'flex-start' }}>
                    <div className="text-muted" style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      <GitCommit size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="text-bold mb-1">{commit.commit.message.split('\n')[0]}</div>
                      <div className="flex-center gap-1 text-sm text-muted" style={{ justifyContent: 'flex-start' }}>
                        <span>{commit.commit.author.name}</span>
                        <span>•</span>
                        <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a href={commit.html_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)' }}>
                      {commit.sha.substring(0, 7)}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-4" style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="mb-3" style={{ fontSize: '1.25rem' }}>Active Team</h3>
          <div className="grid-auto">
            
            <Link href={`/profile/${project.founder_id}`}>
              <div className="glass-panel hover-scale flex-center gap-2 p-2" style={{ justifyContent: 'flex-start', cursor: 'pointer' }}>
                <img 
                  src={project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                  alt={project.users?.full_name} 
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                />
                <div>
                  <div className="flex-center gap-1 text-bold" style={{ fontSize: '0.9rem', justifyContent: 'flex-start' }}>
                    {project.users?.full_name || 'Anonymous'}
                    <span className="text-sm" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '12px' }}>Founder</span>
                  </div>
                  <div className="text-sm text-muted">{project.users?.university}</div>
                </div>
              </div>
            </Link>

            {teamMembers.map((member, index) => (
              <Link key={index} href={`/profile/${member.applicant_id}`}>
                <div className="glass-panel hover-scale flex-center gap-2 p-2" style={{ justifyContent: 'flex-start', cursor: 'pointer' }}>
                  <img 
                    src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Anonymous')}&background=10B981&color=fff`} 
                    alt={member.users?.full_name} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                  />
                  <div>
                    <div className="text-bold" style={{ fontSize: '0.9rem' }}>{member.users?.full_name || 'Anonymous'}</div>
                    <div className="text-sm text-muted">{member.users?.university}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {milestones.length > 0 && (
          <div className="mb-4" style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="mb-3" style={{ fontSize: '1.25rem' }}>BuildTrack Timeline</h3>
            <div className="flex-col gap-3" style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', marginLeft: '12px' }}>
              {milestones.map(m => {
                let details = { desc: m.description, due: '', assigned: '', completed: false };
                try {
                  const parsed = JSON.parse(m.description);
                  if (parsed.desc !== undefined) details = { ...details, ...parsed };
                } catch (e) {}
                
                return (
                  <div key={m.id} className="glass-panel p-3" style={{ position: 'relative', borderColor: details.completed ? 'rgba(16, 185, 129, 0.3)' : undefined }}>
                    <div style={{ position: 'absolute', left: '-31px', top: '28px', width: '14px', height: '14px', borderRadius: '50%', background: details.completed ? '#10B981' : 'var(--accent-primary)', border: '3px solid var(--bg-main)' }}></div>
                    <div className="text-sm text-muted mb-1 text-bold">
                      {new Date(m.created_at).toLocaleDateString()} {details.due ? `• Due: ${new Date(details.due).toLocaleDateString()}` : ''} 
                      {details.completed && <span style={{ color: '#10B981', marginLeft: '8px' }}>✓ Completed</span>}
                    </div>
                    <h4 className="mb-1" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{m.title}</h4>
                    <p className="text-muted" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{details.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {endorsements.length > 0 && (
          <div className="mb-4" style={{ paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="mb-3 flex-center gap-1" style={{ fontSize: '1.25rem', color: 'var(--accent-secondary)', justifyContent: 'flex-start' }}>
              <Award size={24} /> Faculty Endorsements
            </h3>
            <div className="flex-col gap-2">
              {endorsements.map(e => (
                <div key={e.id} className="glass-panel p-3" style={{ background: 'var(--bg-surface-hover)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                  <div className="flex-center gap-2 mb-2" style={{ justifyContent: 'flex-start' }}>
                    <img 
                      src={e.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.users?.full_name || 'Faculty')}&background=a855f7&color=fff`} 
                      alt={e.users?.full_name} 
                      style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                    />
                    <div>
                      <div className="text-bold">{e.users?.full_name || 'Faculty Member'}</div>
                      <div className="text-sm text-muted">{e.users?.university}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.6 }}>"{e.note}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="mb-2" style={{ fontSize: '1.1rem' }}>Required Skills</h3>
          <div className="skills-list" style={{ paddingTop: 0 }}>
            {project.project_skills?.map((skill: any) => (
              <span key={skill.skill_name} className="skill-badge">{skill.skill_name}</span>
            ))}
          </div>
        </div>

        {userRole === 'faculty' && !isFounder && (
          <div className="glass-panel p-3 mb-4" style={{ background: 'rgba(168, 85, 247, 0.05)', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
            <h3 className="mb-2 flex-center gap-1" style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', justifyContent: 'flex-start' }}>
              <Award size={18} /> Endorse this Project
            </h3>
            <p className="text-sm text-muted mb-2">
              Your public note of guidance, ideas, and support gives this student project massive credibility across campus.
            </p>
            <form onSubmit={handleEndorse} className="flex-col gap-2">
              <textarea 
                required 
                maxLength={300}
                className="search-input" 
                placeholder="Write a brief note of support, guidance, or ideas for this team..."
                style={{ minHeight: '80px', resize: 'vertical', borderColor: 'rgba(168, 85, 247, 0.3)' }}
                value={endorsementNote}
                onChange={(e) => setEndorsementNote(e.target.value)}
              />
              <button type="submit" disabled={endorsing} className="btn-primary p-2 text-center" style={{ background: 'var(--accent-secondary)' }}>
                {endorsing ? 'Posting...' : 'Post Endorsement'}
              </button>
            </form>
          </div>
        )}

        {isFounder ? (
          <Link href={`/projects/${project.id}/manage`}>
            <button className="btn-secondary text-center p-3" style={{ width: '100%', fontSize: '1.05rem' }}>
              Manage Project & Applications
            </button>
          </Link>
        ) : (userRole === 'admin' || userRole === 'faculty') ? (
          null
        ) : isAcceptedMember ? (
          <div className="flex-center gap-1 p-3 text-bold text-center" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34D399', borderRadius: '12px' }}>
            <Award size={18} /> You are an active member of this project team!
          </div>
        ) : hasApplied ? (
          <div className="p-3 text-center text-muted text-bold" style={{ background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
            {applicationStatus === 'Declined' 
              ? 'Your application was not selected for this project.'
              : 'Your application is currently pending review.'}
          </div>
        ) : !showPitchForm ? (
          <button 
            onClick={() => setShowPitchForm(true)} 
            className="btn-primary flex-center gap-1 p-3" 
            style={{ width: '100%', fontSize: '1.05rem', background: '#10B981' }}
          >
            <Users size={18} /> Apply to Join Team
          </button>
        ) : (
          <div className="glass-panel p-3" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <h3 className="mb-2" style={{ fontSize: '1.1rem', color: '#10B981' }}>Pitch the Founder</h3>
            <form onSubmit={handleApply} className="flex-col gap-2">
              <textarea 
                required 
                maxLength={300}
                className="search-input" 
                placeholder="Why are you a good fit for this team? (Max 300 characters)"
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
              />
              <div className="text-right text-sm text-muted">
                {pitch.length}/300
              </div>
              <div className="flex-between gap-2">
                <button type="button" onClick={() => setShowPitchForm(false)} className="btn-secondary p-3" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={applying} className="btn-primary p-3 text-center" style={{ flex: 2, fontSize: '1.05rem', background: '#10B981' }}>
                  {applying ? 'Submitting...' : 'Send Pitch'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
