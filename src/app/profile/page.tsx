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

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem' }}>
      Loading profile...
    </div>
  );

  const isVerified = profile?.email?.endsWith('@mmmut.ac.in');

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px', fontFamily: 'Outfit, sans-serif' }}>
      <div className="glass-card" style={{ padding: '36px', position: 'relative' }}>

        <div style={{ position: 'absolute', top: '28px', right: '28px' }}>
          <Link href="/onboarding">
            <button className="btn-ghost" style={{ padding: '10px 22px', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>Edit Profile</button>
          </Link>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .profile-edit-btn-wrap {
              position: static !important;
              margin-bottom: 20px;
            }
            .profile-edit-btn-wrap button {
              width: 100% !important;
            }
            .profile-header {
              justify-content: center !important;
            }
            .profile-avatar {
              width: 120px !important;
              height: 120px !important;
            }
            .profile-info {
              min-width: 100% !important;
              text-align: center;
            }
            .profile-name-row {
              justify-content: center !important;
              flex-wrap: wrap !important;
            }
            .profile-details {
              justify-content: center !important;
            }
            .profile-social-row {
              justify-content: center !important;
            }
            .profile-skills-collab {
              flex-direction: column !important;
            }
            .profile-skills-collab > div {
              min-width: 100% !important;
            }
          }
        `}</style>

        <div className="profile-header" style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: '12px' }}>
          <img
            className="profile-avatar"
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Anonymous')}&background=6366f1&color=fff`}
            alt={profile?.full_name}
            style={{ width: '120px', height: '120px', borderRadius: '20px', border: '3px solid rgba(99,102,241,0.3)', objectFit: 'cover', flexShrink: 0 }}
          />

          <div className="profile-info" style={{ flex: 1, minWidth: '280px' }}>
            <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h1 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: 0, lineHeight: 1.2 }}>
                {profile?.full_name}
              </h1>
              {isVerified && (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))', color: '#fff', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.3px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', whiteSpace: 'nowrap' as const }}>
                  <CheckCircle size={14} /> Verified Student
                </span>
              )}
            </div>

            <div style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '14px', fontWeight: 500 }}>
              <span style={{ color: 'var(--text-primary)' }}>{profile?.degree && `${profile.degree}`}</span> • {profile?.university} • Class of {profile?.graduation_year}
            </div>

            <p style={{ lineHeight: 1.75, fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '18px', margin: 0, marginTop: 0 }}>{profile?.bio}</p>

            <div className="profile-social-row" style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              {profile?.github_link && (
                <a href={profile.github_link} target="_blank" rel="noreferrer" className="glass-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', padding: '10px 18px', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s ease', border: '1px solid var(--border-subtle)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.9 5.07 5.07 0 0 0 19 2c0 0-1.5-.4-4.5 1.5a15.7 15.7 0 0 0-5 0C6.5 1.6 5 2 5 2a5.07 5.07 0 0 0 0 2.9A5.44 5.44 0 0 0 3 9.88c0 5.45 3.3 6.64 6.44 6.99A4.8 4.8 0 0 0 8 19v3"/><path d="M8 20c-3 1-4-1-5-2"/></svg>
                  GitHub <ExternalLink size={13} style={{ opacity: 0.5 }} />
                </a>
              )}
              {profile?.linkedin_link && (
                <a href={profile.linkedin_link} target="_blank" rel="noreferrer" className="glass-card" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', padding: '10px 18px', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.2s ease', border: '1px solid var(--border-subtle)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn <ExternalLink size={13} style={{ opacity: 0.5 }} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="profile-skills-collab" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '28px', marginTop: '28px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '14px', fontWeight: 600 }}>Technical Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile?.user_skills?.map((s: any) => (
                <span key={s.skill_name} className="skill-badge">{s.skill_name}</span>
              ))}
            </div>
          </div>

          <div style={{ minWidth: '260px', background: 'var(--bg-elevated)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px', fontWeight: 600 }}>Collaboration Status</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Let founders know if you are actively looking to join a project team.
            </p>
            <button
              onClick={toggleCollaboration}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                border: profile?.open_to_collaborate ? 'none' : '1px solid var(--border-subtle)',
                background: profile?.open_to_collaborate
                  ? 'linear-gradient(135deg, var(--accent-emerald), #059669)'
                  : 'var(--bg-card)',
                color: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
                boxShadow: profile?.open_to_collaborate ? '0 4px 20px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
                boxShadow: profile?.open_to_collaborate ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
                transition: 'all 0.3s ease',
              }}></div>
              {profile?.open_to_collaborate ? 'Open to Collaborate' : 'Not Looking Right Now'}
            </button>
          </div>
        </div>

        {portfolio.filter(p => p.status !== 'Completed').length > 0 && (
          <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '28px', marginTop: '28px' }}>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} color="var(--accent-emerald)" /> Active Projects
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {portfolio.filter(p => p.status !== 'Completed').map(proj => (
                <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card glow-border" style={{ padding: '20px', cursor: 'pointer', height: '100%', borderLeft: '3px solid', borderImage: 'linear-gradient(to bottom, var(--accent-emerald), var(--accent-blue)) 1', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                        {proj.title}
                      </h4>
                      <span className="badge badge-indigo" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: proj.role === 'Founder' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: proj.role === 'Founder' ? 'var(--accent-violet)' : 'var(--accent-blue)',
                        whiteSpace: 'nowrap' as const,
                        fontWeight: 600,
                      }}>
                        {proj.role === 'Founder' ? <Crown size={11} /> : <Code size={11} />}
                        {proj.role}
                      </span>
                    </div>

                    {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                        {proj.completed_milestones.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.15)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }}></span>
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
          <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', paddingTop: '28px', marginTop: '28px' }}>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={22} color="var(--accent-indigo)" /> Completed Projects
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {portfolio.filter(p => p.status === 'Completed').map(proj => (
                <Link key={proj.id} href={`/projects/${proj.id}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card glow-border" style={{ padding: '20px', cursor: 'pointer', height: '100%', borderLeft: '3px solid', borderImage: 'linear-gradient(to bottom, var(--accent-indigo), var(--accent-violet)) 1', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                        {proj.title}
                      </h4>
                      <span className="badge badge-indigo" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: proj.role === 'Founder' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: proj.role === 'Founder' ? 'var(--accent-violet)' : 'var(--accent-blue)',
                        whiteSpace: 'nowrap' as const,
                        fontWeight: 600,
                      }}>
                        {proj.role === 'Founder' ? <Crown size={11} /> : <Code size={11} />}
                        {proj.role}
                      </span>
                    </div>

                    {proj.completed_milestones && proj.completed_milestones.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                        {proj.completed_milestones.map((m: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '5px 10px',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.15)',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }}></span>
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
