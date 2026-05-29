"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink, Award, Code, Crown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        if (!authLoading) router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*, user_skills(skill_name)')
        .eq('id', user.id)
        .single();
        
      if (data) setProfile(data);
      
      const { data: myProjects } = await supabase
        .from('projects')
        .select('id, title, type, status')
        .eq('founder_id', user.id);

      const { data: appsData } = await supabase
        .from('applications')
        .select('projects(id, title, type, status)')
        .eq('applicant_id', user.id)
        .eq('status', 'Accepted');

      let projectsMap = new Map();
      if (myProjects) {
        myProjects.forEach(p => projectsMap.set(p.id, { ...p, role: 'Founder' }));
      }
      if (appsData) {
        appsData.forEach((a: any) => {
          if (a.projects && !projectsMap.has(a.projects.id)) {
            projectsMap.set(a.projects.id, { ...a.projects, role: 'Core Team' });
          }
        });
      }

      const allProjects = Array.from(projectsMap.values());
      
      if (allProjects.length > 0) {
        const projectIds = allProjects.map(p => p.id);
        const { data: milestones } = await supabase
          .from('milestones')
          .select('project_id, title')
          .in('project_id', projectIds)
          .eq('status', 'Completed');
          
        if (milestones) {
          allProjects.forEach(p => {
            p.completed_milestones = milestones.filter(m => m.project_id === p.id);
          });
        }
      }
      
      setPortfolio(allProjects);
      setLoading(false);
    }
    
    if (!authLoading) {
      loadProfile();
    }
  }, [router, user, authLoading]);

  const toggleCollaboration = async () => {
    const newState = !profile.open_to_collaborate;
    setProfile({ ...profile, open_to_collaborate: newState });
    await supabase.from('users').update({ open_to_collaborate: newState }).eq('id', profile.id);
  };

  if (loading) return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Loading profile...</div>;

  const isVerified = profile?.email?.endsWith('@mmmut.ac.in');

  return (
    <main className="main-content" style={{ maxWidth: '800px' }}>
      <div className="glass-panel p-4" style={{ position: 'relative' }}>
        
        <Link href="/onboarding" style={{ position: 'absolute', top: '40px', right: '40px' }}>
          <button className="btn-secondary text-sm" style={{ padding: '8px 16px' }}>Edit Profile</button>
        </Link>

        <div className="flex-center gap-3 align-start mb-4 flex-wrap" style={{ justifyContent: 'flex-start' }}>
          <img 
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
            alt={profile?.full_name} 
            style={{ width: '140px', height: '140px', borderRadius: '50%', border: '4px solid rgba(99, 102, 241, 0.2)' }}
          />
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 className="mb-1 flex-center gap-2 text-bold" style={{ fontSize: '3rem', justifyContent: 'flex-start', letterSpacing: '-1px' }}>
              {profile?.full_name}
              {isVerified && (
                <span className="flex-center gap-1 text-bold" title="Verified College Email" style={{ color: '#fff', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', padding: '6px 12px', borderRadius: '30px', fontSize: '0.85rem', letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  <CheckCircle size={16} /> Verified Student
                </span>
              )}
            </h1>
            
            <div className="text-muted text-bold mb-3" style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              <span style={{ color: 'var(--text-primary)' }}>{profile?.degree && `${profile.degree}`}</span> • {profile?.university} • Class of {profile?.graduation_year}
            </div>
            
            <p className="mb-4" style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'rgba(255, 255, 255, 0.85)' }}>{profile?.bio}</p>

            <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
              {profile?.github_link && (
                <a href={profile.github_link} target="_blank" rel="noreferrer" className="flex-center gap-1" style={{ color: 'var(--text-primary)', background: 'var(--bg-surface-hover)', padding: '8px 16px', borderRadius: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.9 5.07 5.07 0 0 0 19 2c0 0-1.5-.4-4.5 1.5a15.7 15.7 0 0 0-5 0C6.5 1.6 5 2 5 2a5.07 5.07 0 0 0 0 2.9A5.44 5.44 0 0 0 3 9.88c0 5.45 3.3 6.64 6.44 6.99A4.8 4.8 0 0 0 8 19v3"/><path d="M8 20c-3 1-4-1-5-2"/></svg> GitHub <ExternalLink size={14} color="var(--text-secondary)" />
                </a>
              )}
              {profile?.linkedin_link && (
                <a href={profile.linkedin_link} target="_blank" rel="noreferrer" className="flex-center gap-1" style={{ color: '#3B82F6', background: 'var(--bg-surface-hover)', padding: '8px 16px', borderRadius: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn <ExternalLink size={14} color="var(--text-secondary)" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
          <div>
            <h3 className="mb-2" style={{ fontSize: '1.25rem' }}>Technical Skills</h3>
            <div className="skills-list" style={{ paddingTop: 0 }}>
              {profile?.user_skills?.map((s: any) => (
                <span key={s.skill_name} className="skill-badge">{s.skill_name}</span>
              ))}
            </div>
          </div>
          
          <div className="p-3" style={{ background: 'var(--bg-surface-hover)', borderRadius: '16px', minWidth: '250px' }}>
            <h4 className="mb-1" style={{ fontSize: '1.1rem' }}>Collaboration Status</h4>
            <p className="text-sm text-muted mb-2">
              Let founders know if you are actively looking to join a project team.
            </p>
            <button 
              onClick={toggleCollaboration}
              className="btn-primary flex-center gap-1 text-center" 
              style={{ 
                width: '100%', 
                background: profile?.open_to_collaborate ? '#10B981' : 'var(--bg-surface)',
                color: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
                border: profile?.open_to_collaborate ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)' }}></div>
              {profile?.open_to_collaborate ? 'Open to Collaborate' : 'Not Looking Right Now'}
            </button>
          </div>
        </div>

        
        {portfolio.filter(p => p.status !== 'Completed').length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <h3 className="mb-3 flex-center gap-1" style={{ fontSize: '1.5rem', justifyContent: 'flex-start' }}>
              <Award size={24} color="#10B981" /> Active Projects
            </h3>
            
            <div className="grid-auto">
              {portfolio.filter(p => p.status !== 'Completed').map(proj => (
                <Link key={proj.id} href={`/projects/${proj.id}`}>
                  <div className="glass-panel hover-scale p-3 flex-col gap-2" style={{ cursor: 'pointer', height: '100%', borderLeft: '4px solid #10B981' }}>
                    
                    <div className="flex-between align-start">
                      <h4 className="mb-0 flex-center gap-1 text-bold" style={{ fontSize: '1.1rem', flex: 1, justifyContent: 'flex-start' }}>
                        {proj.title}
                      </h4>
                      <span className="flex-center gap-1 text-bold" style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        background: proj.role === 'Founder' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: proj.role === 'Founder' ? '#A855F7' : '#3B82F6',
                        whiteSpace: 'nowrap'
                      }}>
                        {proj.role === 'Founder' ? <Crown size={12} /> : <Code size={12} />}
                        {proj.role}
                      </span>
                    </div>

                    {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                      <div className="flex-center gap-1 flex-wrap mt-auto" style={{ justifyContent: 'flex-start' }}>
                        {proj.completed_milestones.map((m: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex-center gap-1 text-muted"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '6px 10px', 
                              borderRadius: '20px', 
                              background: 'var(--bg-surface-hover)', 
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                            {m.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {portfolio.filter(p => p.status === 'Completed').length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <h3 className="mb-3 flex-center gap-1" style={{ fontSize: '1.5rem', justifyContent: 'flex-start' }}>
              <Award size={24} color="#6366f1" /> Completed Projects
            </h3>
            
            <div className="grid-auto">
              {portfolio.filter(p => p.status === 'Completed').map(proj => (
                <Link key={proj.id} href={`/projects/${proj.id}`}>
                  <div className="glass-panel hover-scale p-3 flex-col gap-2" style={{ cursor: 'pointer', height: '100%', borderLeft: '4px solid #6366f1' }}>
                    
                    <div className="flex-between align-start">
                      <h4 className="mb-0 flex-center gap-1 text-bold" style={{ fontSize: '1.1rem', flex: 1, justifyContent: 'flex-start' }}>
                        {proj.title}
                      </h4>
                      <span className="flex-center gap-1 text-bold" style={{ 
                        fontSize: '0.75rem', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        background: proj.role === 'Founder' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: proj.role === 'Founder' ? '#A855F7' : '#3B82F6',
                        whiteSpace: 'nowrap'
                      }}>
                        {proj.role === 'Founder' ? <Crown size={12} /> : <Code size={12} />}
                        {proj.role}
                      </span>
                    </div>

                    {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                      <div className="flex-center gap-1 flex-wrap mt-auto" style={{ justifyContent: 'flex-start' }}>
                        {proj.completed_milestones.map((m: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex-center gap-1 text-muted"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '6px 10px', 
                              borderRadius: '20px', 
                              background: 'var(--bg-surface-hover)', 
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                            {m.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
