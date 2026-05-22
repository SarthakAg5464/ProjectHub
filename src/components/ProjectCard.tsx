"use client";

import React from 'react';
import { Clock, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project, index }: { project: any, index: number }) {
  return (
    <div 
      className="project-card glass-panel animate-fade-in"
      style={{ animationDelay: `${(index * 0.1) + 0.3}s` }}
    >
      <div className="card-header">
        <div>
          <div className="project-type">{project.type}</div>
          <h3 className="project-title">{project.title}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {project.matchScore > 0 && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34D399', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>
              {project.matchScore}% Match
            </div>
          )}
          <img 
            src={project.founderAvatar} 
            alt={project.founder} 
            style={{ width: '32px', height: '32px', borderRadius: '50%', marginBottom: '4px' }} 
          />
        </div>
      </div>
      
      <p className="project-desc">{project.description}</p>
      
      <div className="skills-list">
        {project.skillsRequired.map((skill: string) => (
          <span 
            key={skill} 
            className={`skill-badge ${project.matchedSkills?.includes(skill) ? 'match' : ''}`}
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="card-footer">
        <div className="team-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={14} /> {project.teamSize}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
            <Clock size={14} /> {project.commitment}
          </div>
        </div>
        <Link href={`/projects/${project.id}`}>
          <button 
            className="btn-primary" 
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View <ChevronRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );
}
