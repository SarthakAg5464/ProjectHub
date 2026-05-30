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
    return <div className="flex-center" style={{ minHeight: '60vh', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>Loading project details...</div>;
  }

  if (!project) {
    return <div className="flex-center" style={{ minHeight: '60vh', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>Project not found.</div>;
  }

  const isFounder = user?.id === project.founder_id;

  return (
    <main className="main-content" style={{ maxWidth: '860px' }}>
      <BackButton href="/" text="Back to IdeaBoard" />

      <div className="glass-card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          {endorsements.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.82rem', padding: '6px 14px', gap: '6px' }}>
                <Award size={14} /> {endorsements.length} Faculty Endorsement{endorsements.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span className="badge badge-indigo">{project.type}</span>
            <span className="badge badge-indigo">{project.stage}</span>
          </div>
          <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '12px', lineHeight: 1.15 }}>{project.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>{project.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            <Users size={18} color="var(--accent-indigo)" />
            <span>{project.team_size}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            <Clock size={18} color="var(--accent-indigo)" />
            <span>{project.commitment}</span>
          </div>
        </div>

        {project.github_url && (
          <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GitBranch size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>GitHub Activity</h3>
              </div>
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                View Repository
              </a>
            </div>
            
            {commits.length === 0 ? (
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No recent commits found or repository is private.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {commits.map((commit: any, idx: number) => (
                  <div key={idx} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitCommit size={18} color="var(--accent-indigo)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{commit.commit.message.split('\n')[0]}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>{commit.commit.author.name}</span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{new Date(commit.commit.author.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a href={commit.html_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-violet)', fontFamily: 'monospace', flexShrink: 0 }}>
                      {commit.sha.substring(0, 7)}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>Active Team</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
            <Link href={`/profile/${project.founder_id}`} style={{ flex: '1 1 calc(50% - 7px)', minWidth: '240px' }}>
              <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <img
                  src={project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`}
                  alt={project.users?.full_name}
                  style={{ width: '42px', height: '42px', borderRadius: '14px', border: '2px solid rgba(99,102,241,0.25)', objectFit: 'cover' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{project.users?.full_name || 'Anonymous'}</span>
                    <span className="badge badge-indigo">Founder</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{project.users?.university}</div>
                </div>
              </div>
            </Link>

            {teamMembers.map((member, index) => (
              <Link key={index} href={`/profile/${member.applicant_id}`} style={{ flex: '1 1 calc(50% - 7px)', minWidth: '240px' }}>
                <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <img
                    src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Anonymous')}&background=10B981&color=fff`}
                    alt={member.users?.full_name}
                    style={{ width: '42px', height: '42px', borderRadius: '14px', border: '2px solid rgba(99,102,241,0.25)', objectFit: 'cover' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{member.users?.full_name || 'Anonymous'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{member.users?.university}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {milestones.length > 0 && (
          <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '20px' }}>BuildTrack Timeline</h3>
            <div style={{ borderLeft: '2px solid rgba(99,102,241,0.15)', paddingLeft: '28px', marginLeft: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {milestones.map(m => {
                let details: any = { desc: m.description, due: '', assigned: '', completed: false, completed_at: '' };
                try {
                  const parsed = JSON.parse(m.description);
                  if (parsed.desc !== undefined) details = { ...details, ...parsed };
                } catch (e) {}
                
                const isOverdue = !details.completed && details.due && new Date(details.due) < new Date(new Date().setHours(0,0,0,0));

                return (
                  <div key={m.id} className="glass-card" style={{ position: 'relative', padding: '20px', borderColor: details.completed ? 'rgba(16, 185, 129, 0.3)' : isOverdue ? 'rgba(248, 113, 113, 0.3)' : undefined }}>
                    <div style={{ position: 'absolute', left: '-35px', top: '24px', width: '12px', height: '12px', borderRadius: '50%', background: details.completed ? 'var(--accent-emerald)' : isOverdue ? '#f87171' : 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', boxShadow: details.completed ? '0 0 8px rgba(16,185,129,0.4)' : isOverdue ? '0 0 8px rgba(248,113,113,0.4)' : '0 0 8px rgba(99,102,241,0.3)' }}></div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                      {details.due && <span style={{ color: isOverdue ? '#f87171' : undefined }}>• Due: {new Date(details.due).toLocaleDateString()}</span>}
                      {details.completed && (
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '4px', 
                          background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' 
                        }}>
                          ✓ Completed {details.completed_at && `on ${new Date(details.completed_at).toLocaleDateString()}`}
                        </span>
                      )}
                      {isOverdue && <span style={{ color: '#f87171', fontWeight: 700 }}>⚠️ Overdue</span>}
                    </div>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>{m.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.92rem', margin: 0 }}>{details.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {endorsements.length > 0 && (
          <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-violet), #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Faculty Endorsements</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {endorsements.map(e => (
                <div key={e.id} style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <img
                      src={e.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.users?.full_name || 'Faculty')}&background=a855f7&color=fff`}
                      alt={e.users?.full_name}
                      style={{ width: '42px', height: '42px', borderRadius: '14px', border: '2px solid rgba(99,102,241,0.25)', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{e.users?.full_name || 'Faculty Member'}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{e.users?.university}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontStyle: 'italic', lineHeight: 1.7, paddingLeft: '4px', borderLeft: '2px solid rgba(139,92,246,0.3)' }}>&ldquo;{e.note}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ paddingBottom: '28px', marginBottom: '28px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Required Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {project.project_skills?.map((skill: any) => (
              <span key={skill.skill_name} className="badge badge-success" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>{skill.skill_name}</span>
            ))}
          </div>
        </div>

        {userRole === 'faculty' && !isFounder && (
          <div style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Award size={20} color="var(--accent-violet)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-violet)' }}>Endorse this Project</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              Your public note of guidance, ideas, and support gives this student project massive credibility across campus.
            </p>
            <form onSubmit={handleEndorse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                required
                maxLength={300}
                className="search-field"
                placeholder="Write a brief note of support, guidance, or ideas for this team..."
                style={{ minHeight: '90px', resize: 'vertical', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                value={endorsementNote}
                onChange={(e) => setEndorsementNote(e.target.value)}
              />
              <button type="submit" disabled={endorsing} className="btn-glow" style={{ background: 'linear-gradient(135deg, var(--accent-violet), #a855f7)', textAlign: 'center', padding: '12px 24px' }}>
                {endorsing ? 'Posting...' : 'Post Endorsement'}
              </button>
            </form>
          </div>
        )}

        {isFounder ? (
          <Link href={`/projects/${project.id}/manage`}>
            <button className="btn-glow" style={{ width: '100%', textAlign: 'center', padding: '14px 24px', fontSize: '1rem' }}>
              Manage Project & Applications
            </button>
          </Link>
        ) : (userRole === 'admin' || userRole === 'faculty') ? (
          null
        ) : isAcceptedMember ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', color: '#34D399', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Award size={18} /> You are an active member of this project team!
          </div>
        ) : hasApplied ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {applicationStatus === 'Declined'
              ? 'Your application was not selected for this project.'
              : 'Your application is currently pending review.'}
          </div>
        ) : !showPitchForm ? (
          <button
            onClick={() => setShowPitchForm(true)}
            className="btn-glow"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px 24px', fontSize: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Users size={18} /> Apply to Join Team
          </button>
        ) : (
          <div className="glass-panel" style={{ padding: '24px', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '16px' }}>Pitch the Founder</h3>
            <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                required
                maxLength={300}
                className="search-field"
                placeholder="Why are you a good fit for this team? (Max 300 characters)"
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {pitch.length}/300
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowPitchForm(false)} className="btn-ghost" style={{ flex: 1, padding: '12px 24px', textAlign: 'center', minWidth: '120px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={applying} className="btn-glow" style={{ flex: 2, padding: '12px 24px', textAlign: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', minWidth: '180px' }}>
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
