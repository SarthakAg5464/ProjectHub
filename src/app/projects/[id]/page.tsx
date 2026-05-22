"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Clock, Users, ArrowLeft } from 'lucide-react';
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
            .select('id')
            .eq('project_id', id)
            .eq('applicant_id', session.user.id)
            .single();
            
          if (appData) setHasApplied(true);
        }
      }

      const { data: membersData } = await supabase
        .from('applications')
        .select(`users ( full_name, avatar_url, university )`)
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading project details...</div>;
  }

  if (!project) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Project not found.</div>;
  }

  const isFounder = user?.id === project.founder_id;

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '100px' }}>
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to IdeaBoard
      </Link>
      
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div className="project-type" style={{ marginBottom: '8px' }}>{project.type} • {project.stage}</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{project.title}</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{project.description}</p>
        </div>
        
        <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--text-secondary)" />
            <span>{project.team_size}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--text-secondary)" />
            <span>{project.commitment}</span>
          </div>
        </div>

        <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Active Team</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            
            {/* Founder Card */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={project.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
                alt={project.users?.full_name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{project.users?.full_name || 'Anonymous'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>Founder</div>
              </div>
            </div>

            {/* Accepted Members */}
            {teamMembers.map((member, index) => (
              <div key={index} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                  src={member.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.users?.full_name || 'Anonymous')}&background=10B981&color=fff`} 
                  alt={member.users?.full_name} 
                  style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.users?.full_name || 'Anonymous'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Member</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {milestones.length > 0 && (
          <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>BuildTrack Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderLeft: '2px solid var(--border-color)', paddingLeft: '24px', marginLeft: '12px' }}>
              {milestones.map(m => (
                <div key={m.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-31px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{m.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Required Skills</h3>
          <div className="skills-list" style={{ paddingTop: 0 }}>
            {project.project_skills?.map((skill: any) => (
              <span key={skill.skill_name} className="skill-badge">{skill.skill_name}</span>
            ))}
          </div>
        </div>

        {isFounder ? (
          <Link href={`/projects/${project.id}/manage`}>
            <button className="btn-secondary" style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}>
              Manage Project & Applications
            </button>
          </Link>
        ) : hasApplied ? (
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(52, 211, 153, 0.1)', color: '#34D399', borderRadius: '12px', fontWeight: 500 }}>
            You have applied to this project!
          </div>
        ) : (
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontWeight: 500 }}>Pitch the Founder</label>
            <textarea 
              required 
              maxLength={300}
              className="search-input" 
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
            />
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {pitch.length}/300
            </div>
            <button type="submit" disabled={applying} className="btn-primary" style={{ padding: '16px', fontSize: '1.05rem' }}>
              {applying ? 'Submitting...' : 'Apply to Join Team'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
