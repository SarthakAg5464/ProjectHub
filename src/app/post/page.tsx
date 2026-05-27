"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { PREDEFINED_SKILLS } from '../../lib/skills';
import { useAuth } from '../../components/AuthProvider';

export default function PostProject() {
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Web App',
    description: '',
    commitment: '',
    teamSize: '',
    stage: 'Idea Stage'
  });

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else if (selectedSkills.length < 15) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        founder_id: user.id,
        title: formData.title,
        type: formData.type,
        description: formData.description,
        commitment: formData.commitment,
        team_size: formData.teamSize,
        stage: formData.stage,
        status: 'Open'
      })
      .select()
      .single();

    if (projectError) {
      alert(projectError.message);
      setLoading(false);
      return;
    }

    if (selectedSkills.length > 0) {
      const projectSkills = selectedSkills.map(skill => ({
        project_id: project.id,
        skill_name: skill,
        is_required: true
      }));

      await supabase.from('project_skills').insert(projectSkills);
    }

    setLoading(false);
    window.location.href = '/';
  };

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '120px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Post a Project</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Fill out the details below to find teammates for your idea.</p>
      
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Project Title</label>
          <input 
            type="text" 
            required 
            className="search-input" 
            style={{ padding: '12px 16px' }}
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Project Type</label>
            <select 
              className="search-input" 
              style={{ padding: '12px 16px', appearance: 'none' }}
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option>Web App</option>
              <option>Mobile App</option>
              <option>AI/ML</option>
              <option>Hardware/IoT</option>
              <option>Data Science</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Project Stage</label>
            <select 
              className="search-input" 
              style={{ padding: '12px 16px', appearance: 'none' }}
              value={formData.stage}
              onChange={(e) => setFormData({...formData, stage: e.target.value})}
            >
              <option>Idea Stage</option>
              <option>Prototyping</option>
              <option>Building</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 500 }}>Description</label>
          <textarea 
            required 
            className="search-input" 
            style={{ padding: '12px 16px', minHeight: '120px', resize: 'vertical' }}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 500 }}>
            <span>Skills Required</span>
            <span style={{ color: selectedSkills.length === 15 ? '#F87171' : 'var(--text-secondary)' }}>{selectedSkills.length} / 15</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PREDEFINED_SKILLS.map(skill => {
              const isSelected = selectedSkills.includes(skill);
              const isDisabled = !isSelected && selectedSkills.length >= 15;
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  disabled={isDisabled}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    border: isSelected ? '1px solid #818CF8' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-surface)',
                    color: isSelected ? '#818CF8' : (isDisabled ? 'var(--text-secondary)' : 'var(--text-primary)'),
                    transition: 'all 0.2s'
                  }}
                >
                  {skill}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Commitment Level</label>
            <input 
              type="text" 
              placeholder="e.g. 10 hrs/wk"
              className="search-input" 
              style={{ padding: '12px 16px' }}
              value={formData.commitment}
              onChange={(e) => setFormData({...formData, commitment: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 500 }}>Team Size Needed</label>
            <input 
              type="text" 
              placeholder="e.g. 2/4"
              className="search-input" 
              style={{ padding: '12px 16px' }}
              value={formData.teamSize}
              onChange={(e) => setFormData({...formData, teamSize: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '16px', padding: '14px', fontSize: '1.05rem' }}>
          {loading ? 'Posting...' : 'Post Project'}
        </button>
      </form>
    </main>
  );
}
