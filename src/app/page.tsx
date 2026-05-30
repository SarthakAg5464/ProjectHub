"use client";

import React, { useState, useEffect } from 'react';
import { Search, Code, Rocket, Users as UsersIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

const HeroSection = ({ onExplore, onHowItWorks }: { onExplore: () => void, onHowItWorks: () => void }) => (
  <section className="hero animate-fade-in delay-1" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div className="badge badge-indigo" style={{ marginBottom: '20px', fontSize: '0.8rem', padding: '6px 16px' }}>
      <Sparkles size={14} /> Campus Collaboration Platform
    </div>
    <h1>Find your people.<br />Build real things.</h1>
    <p>
      Join over thousands of students bridging the gap between ideas and execution.
      Stop losing potential teammates to chaotic group chats. Build your portfolio today.
    </p>
    <div className="hero-actions">
      <button className="btn-glow" onClick={onExplore} style={{ padding: '14px 36px', fontSize: '1rem' }}>Explore Projects</button>
      <button className="btn-ghost" onClick={onHowItWorks} style={{ padding: '14px 36px', fontSize: '1rem' }}>How it works</button>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section id="how-it-works" className="animate-fade-in delay-2" style={{ marginBottom: '60px', scrollMarginTop: '100px' }}>
    <h2 className="section-title text-center mb-4">How ProjectHub Works</h2>
    <div className="grid-auto" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="step-card">
        <div className="step-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Rocket size={28} />
        </div>
        <h3>1. Post an Idea</h3>
        <p>Got a vision? Publish your project on the IdeaBoard and outline the exact skills you need to make it happen.</p>
      </div>
      <div className="step-card">
        <div className="step-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-violet)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <Search size={28} />
        </div>
        <h3>2. Find a Match</h3>
        <p>Our SkillMatch engine instantly highlights projects that perfectly align with your technical stack and interests.</p>
      </div>
      <div className="step-card">
        <div className="step-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <UsersIcon size={28} />
        </div>
        <h3>3. Form a Team</h3>
        <p>Apply with a quick pitch, get accepted by the founder, and start building real-world experience for your resume.</p>
      </div>
    </div>
  </section>
);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [projects, setProjects] = useState<any[]>([]);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("student");
  const [dbError, setDbError] = useState<string | null>(null);
  const router = useRouter();

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

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role || 'student');
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, title, type, description, commitment, team_size, stage, status,
          users!projects_founder_id_fkey ( full_name, avatar_url ),
          project_skills!project_skills_project_id_fkey ( skill_name, is_required ),
          endorsements!endorsements_project_id_fkey ( id )
        `)
        .eq('status', 'Open')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase Error:", error);
        setDbError(error.message || JSON.stringify(error));
      }
      
      if (data) {
        let formattedProjects = data.map((p: any) => {
          const reqSkills = p.project_skills ? p.project_skills.filter((s: any) => s.is_required).map((s: any) => s.skill_name) : [];
          const niceSkills = p.project_skills ? p.project_skills.filter((s: any) => !s.is_required).map((s: any) => s.skill_name) : [];
          
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
            skillsNice: niceSkills,
            matchedSkills: matchedSkills,
            matchScore: matchScore,
            endorsementCount: p.endorsements ? p.endorsements.length : 0
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
      <HeroSection 
        onExplore={() => scrollToSection('ideaboard')} 
        onHowItWorks={() => scrollToSection('how-it-works')} 
      />
      
      <HowItWorksSection />

      <section id="ideaboard" className="animate-fade-in delay-3" style={{ scrollMarginTop: '100px' }}>
        <div className="section-header text-center" style={{ marginBottom: '40px' }}>
          <h2 className="section-title">The IdeaBoard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Find a team and start building.</p>
        </div>
        <div className="filters-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by project name or skills..." 
              className="search-input"
              style={{ paddingLeft: '44px' }}
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

        {dbError && (
          <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', color: '#EF4444', marginBottom: '30px', textAlign: 'center' }}>
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {loading ? (
          <div className="glass-card p-4 text-center" style={{ color: 'var(--text-secondary)' }}>
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
          <div className="glass-card p-4 flex-col flex-center text-center mt-4" style={{ gap: '16px' }}>
            <div className="flex-center" style={{ background: 'rgba(99,102,241,0.1)', width: '80px', height: '80px', borderRadius: '20px', color: 'var(--accent-indigo)' }}>
              <Code size={36} />
            </div>
            
            {projects.length === 0 ? (
              <>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>No projects available</h3>
                <p className="text-muted" style={{ maxWidth: '400px', lineHeight: 1.6 }}>
                  {userRole === 'admin' || userRole === 'faculty' 
                    ? "It looks like the IdeaBoard is currently empty. Students haven't posted any projects yet."
                    : "It looks like the IdeaBoard is currently empty. Be the pioneer on your campus and kickstart the very first project!"}
                </p>
                {user ? (
                  userRole !== 'admin' && userRole !== 'faculty' && (
                    <button className="btn-glow" onClick={() => router.push('/post')}>
                      Post the First Project
                    </button>
                  )
                ) : (
                  <button className="btn-glow" onClick={handleLogin}>
                    Log in to Post a Project
                  </button>
                )}
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>No matches found</h3>
                <p className="text-muted" style={{ maxWidth: '400px', lineHeight: 1.6 }}>
                  We couldn't find any projects matching your current filters or search query. Try adjusting them to see more results!
                </p>
                <button className="btn-ghost" onClick={() => { setSearchQuery(""); setActiveFilter("All"); }}>
                  Clear Filters
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
