"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
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

  if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Loading profile...</div>;

  const isVerified = profile?.email?.endsWith('@mmmut.ac.in');

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '100px' }}>
      <div className="glass-panel" style={{ padding: '40px', position: 'relative' }}>
        
        <Link href="/onboarding" style={{ position: 'absolute', top: '40px', right: '40px' }}>
          <button className="btn-secondary" style={{ padding: '8px 16px' }}>Edit Profile</button>
        </Link>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap' }}>
          <img 
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Anonymous')}&background=6366f1&color=fff`} 
            alt={profile?.full_name} 
            style={{ width: '140px', height: '140px', borderRadius: '50%', border: '4px solid rgba(99, 102, 241, 0.2)' }}
          />
          
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px', fontWeight: 700, letterSpacing: '-1px' }}>
              {profile?.full_name}
              {isVerified && (
                <span title="Verified College Email" style={{ display: 'flex', alignItems: 'center', color: '#fff', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', padding: '6px 12px', borderRadius: '30px', fontSize: '0.85rem', gap: '6px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  <CheckCircle size={16} /> Verified Student
                </span>
              )}
            </h1>
            
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '24px', fontWeight: 500 }}>
              <span style={{ color: 'var(--text-primary)' }}>{profile?.degree && `${profile.degree}`}</span> • {profile?.university} • Class of {profile?.graduation_year}
            </div>
            
            <p style={{ lineHeight: 1.8, fontSize: '1.1rem', marginBottom: '32px', color: 'rgba(255, 255, 255, 0.85)' }}>{profile?.bio}</p>

            <div style={{ display: 'flex', gap: '16px' }}>
              {profile?.github_link && (
                <a href={profile.github_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', background: 'var(--bg-surface-hover)', padding: '8px 16px', borderRadius: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.9 5.07 5.07 0 0 0 19 2c0 0-1.5-.4-4.5 1.5a15.7 15.7 0 0 0-5 0C6.5 1.6 5 2 5 2a5.07 5.07 0 0 0 0 2.9A5.44 5.44 0 0 0 3 9.88c0 5.45 3.3 6.64 6.44 6.99A4.8 4.8 0 0 0 8 19v3"/><path d="M8 20c-3 1-4-1-5-2"/></svg> GitHub <ExternalLink size={14} color="var(--text-secondary)" />
                </a>
              )}
              {profile?.linkedin_link && (
                <a href={profile.linkedin_link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', background: 'var(--bg-surface-hover)', padding: '8px 16px', borderRadius: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg> LinkedIn <ExternalLink size={14} color="var(--text-secondary)" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Technical Skills</h3>
            <div className="skills-list" style={{ paddingTop: 0 }}>
              {profile?.user_skills?.map((s: any) => (
                <span key={s.skill_name} className="skill-badge">{s.skill_name}</span>
              ))}
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-surface-hover)', padding: '24px', borderRadius: '16px', minWidth: '250px' }}>
            <h4 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Collaboration Status</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Let founders know if you are actively looking to join a project team.
            </p>
            <button 
              onClick={toggleCollaboration}
              className="btn-primary" 
              style={{ 
                width: '100%', 
                background: profile?.open_to_collaborate ? '#10B981' : 'var(--bg-surface)',
                color: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)',
                border: profile?.open_to_collaborate ? 'none' : '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: profile?.open_to_collaborate ? '#fff' : 'var(--text-secondary)' }}></div>
              {profile?.open_to_collaborate ? 'Open to Collaborate' : 'Not Looking Right Now'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
