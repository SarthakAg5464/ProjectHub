"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Code, Rocket, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [projects, setProjects] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const filters = ["All", "Web App", "Mobile App", "AI/ML", "Hardware/IoT"];

  useEffect(() => {
    async function fetchProjects() {
      let userSkills: string[] = [];

      if (user) {
        const { data: uSkills } = await supabase
          .from('user_skills')
          .select('skill_name')
          .eq('user_id', user.id);
        if (uSkills) {
          userSkills = uSkills.map((s: any) => s.skill_name.toLowerCase());
        }
      }

      const { data } = await supabase
        .from('projects')
        .select(`
          id, title, type, description, commitment, team_size, stage, status,
          users ( full_name, avatar_url ),
          project_skills ( skill_name )
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });
      
      if (data) {
        let formattedProjects = data.map((p: any) => {
          const reqSkills = p.project_skills ? p.project_skills.map((s: any) => s.skill_name) : [];
          
          let matchedSkills: string[] = [];
          let matchScore = 0;

          if (userSkills.length > 0 && reqSkills.length > 0) {
            matchedSkills = reqSkills.filter((rs: string) => userSkills.includes(rs.toLowerCase()));
            matchScore = Math.round((matchedSkills.length / reqSkills.length) * 100);
          }

          return {
            id: p.id,
            title: p.title,
            type: p.type,
            description: p.description,
            commitment: p.commitment,
            teamSize: p.team_size,
            stage: p.stage,
            founder: p.users?.full_name || 'Anonymous',
            founderAvatar: p.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.users?.full_name || 'Anonymous')}&background=6366f1&color=fff`,
            skillsRequired: reqSkills,
            matchedSkills: matchedSkills,
            matchScore: matchScore
          };
        });

        if (user && userSkills.length > 0) {
          formattedProjects.sort((a, b) => b.matchScore - a.matchScore);
        }

        setProjects(formattedProjects);
      }
      setLoading(false);
    }
    
    if (!authLoading) {
      fetchProjects();
    }
  }, [user, authLoading]);

  const filteredProjects = projects.filter(project => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = project.title.toLowerCase().includes(searchLower) || 
                          project.description.toLowerCase().includes(searchLower) ||
                          project.skillsRequired.some((skill: string) => skill.toLowerCase().includes(searchLower));
    const matchesFilter = activeFilter === "All" || project.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <main className="main-content">
      <section className="hero animate-fade-in delay-1" style={{ marginBottom: '60px' }}>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '20px' }}>Find your people.<br />Build real things.</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 32px auto', fontSize: '1.2rem', lineHeight: 1.6 }}>
          Join over thousands of students bridging the gap between ideas and execution. 
          Stop losing potential teammates to chaotic group chats. Build your portfolio today.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => scrollToSection('ideaboard')}>Explore Projects</button>
          <button className="btn-secondary" onClick={() => scrollToSection('how-it-works')}>How it works</button>
        </div>
      </section>

      <section id="how-it-works" className="animate-fade-in delay-2" style={{ marginBottom: '80px', scrollMarginTop: '100px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '40px' }}>How ProjectHub Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-surface-hover)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--accent-primary)' }}>
              <Rocket size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>1. Post an Idea</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Got a vision? Publish your project on the IdeaBoard and outline the exact skills you need to make it happen.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-surface-hover)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--accent-primary)' }}>
              <Search size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>2. Find a Match</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Our SkillMatch engine instantly highlights projects that perfectly align with your technical stack and interests.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-surface-hover)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--accent-primary)' }}>
              <UsersIcon size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>3. Form a Team</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Apply with a quick pitch, get accepted by the founder, and start building real-world experience for your resume.</p>
          </div>
        </div>
      </section>

      <section id="ideaboard" className="animate-fade-in delay-3" style={{ scrollMarginTop: '100px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>The IdeaBoard</h2>
        <div className="filters-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by project name or skills..." 
              className="search-input"
              style={{ paddingLeft: '48px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-tags">
            {filters.map(filter => (
              <button 
                key={filter}
                className={`filter-tag ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Loading projects...
          </div>
        ) : (
          <div className="idea-board">
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
        
        {!loading && filteredProjects.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: 'var(--bg-surface-hover)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--text-secondary)' }}>
              <Code size={40} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '12px' }}>No projects available</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
              It looks like the IdeaBoard is currently empty. Be the pioneer on your campus and kickstart the very first project!
            </p>
            <button className="btn-primary" onClick={handleLogin} style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Log in to Post a Project
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
