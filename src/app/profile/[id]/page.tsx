"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import BackButton from '../../../components/BackButton';
import { Award, Briefcase, Code, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function PublicProfile({ params }: { params: { id: string } }) {
  const { id } = params;
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (user) {
        setProfile(user);

        const { data: sData } = await supabase
          .from('user_skills')
          .select('skill_name')
          .eq('user_id', id);
        if (sData) setSkills(sData.map((s: any) => s.skill_name));

        const { data: pData } = await supabase
          .from('applications')
          .select(`
            status,
            projects ( id, title, type, description, status )
          `)
          .eq('applicant_id', id)
          .eq('status', 'Accepted');
          
        const { data: foundedProjects } = await supabase
          .from('projects')
          .select('id, title, type, description, status')
          .eq('founder_id', id);

        const allProjects = [];
        if (pData) allProjects.push(...pData.map((p: any) => p.projects));
        if (foundedProjects) allProjects.push(...foundedProjects);

        // Deduplicate in case somehow they are both founder and applicant (shouldn't happen, but safe)
        const uniqueProjects = Array.from(new Map(allProjects.filter(p => p).map(p => [p.id, p])).values());
        
        setProjects(uniqueProjects);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Profile not found.</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '100px' }}>
      <BackButton href="back" text="Go Back" />
      
      <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <img 
            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=6366f1&color=fff`} 
            alt={profile.full_name} 
            style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--bg-surface-hover)' }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{profile.full_name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <GraduationCap size={16} /> {profile.university || 'University not specified'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Award size={16} /> {profile.role}
              </div>
            </div>
            <p style={{ marginTop: '16px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {profile.bio || 'No bio provided.'}
            </p>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} /> Skills
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map((skill, index) => (
              <span key={index} className="skill-badge">{skill}</span>
            ))}
            {skills.length === 0 && <span style={{ color: 'var(--text-secondary)' }}>No skills listed.</span>}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} /> Active Projects
          </h3>
          {projects.filter(p => p.status !== 'Completed').length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>No active projects.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {projects.filter(p => p.status !== 'Completed').map((proj, idx) => (
                <Link href={`/projects/${proj.id}`} key={idx}>
                  <div className="glass-panel hover-scale" style={{ padding: '24px', cursor: 'pointer', borderLeft: '4px solid #10B981' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 600 }}>{proj.type}</div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{proj.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{proj.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={20} /> Completed Projects
          </h3>
          {projects.filter(p => p.status === 'Completed').length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No completed projects.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {projects.filter(p => p.status === 'Completed').map((proj, idx) => (
                <Link href={`/projects/${proj.id}`} key={idx}>
                  <div className="glass-panel hover-scale" style={{ padding: '24px', cursor: 'pointer', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '4px', fontWeight: 600 }}>{proj.type}</div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{proj.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{proj.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
