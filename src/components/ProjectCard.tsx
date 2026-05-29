"use client";

import React from 'react';
import { Clock, Users, ChevronRight, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project, index }: { project: any, index: number }) {
  return (
    <div 
      className="project-card glass-panel animate-fade-in"
      style={{ animationDelay: `${(index * 0.1) + 0.3}s` }}
    >
      <div className="card-header flex-between align-start">
        <div>
          <div className="project-type mb-1">{project.type}</div>
          <h3 className="project-title m-0">{project.title}</h3>
        </div>
        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          {project.matchScore > 0 && (
            <div className="text-sm text-bold mb-2" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34D399', padding: '4px 8px', borderRadius: '8px', textAlign: 'right' }}>
              {project.matchedSkills?.length} of {project.skillsRequired?.length} required skills
            </div>
          )}
          {project.endorsementCount > 0 && (
            <div className="flex-center gap-1 text-sm text-bold mb-2" style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
              <Award size={12} /> Endorsed
            </div>
          )}
          <img 
            src={project.founderAvatar} 
            alt={project.founder} 
            style={{ width: '32px', height: '32px', borderRadius: '50%', marginBottom: '4px' }} 
          />
        </div>
      </div>
      
      <p className="project-desc mt-2">{project.description}</p>
      
      <div className="skills-list">
        {project.skillsRequired?.map((skill: string) => (
          <span 
            key={`req-${skill}`} 
            className={`skill-badge ${project.matchedSkills?.includes(skill) ? 'match' : ''}`}
            title="Required Skill"
            style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
          >
            {skill}
          </span>
        ))}
        {project.skillsNice?.map((skill: string) => (
          <span 
            key={`nice-${skill}`} 
            className="skill-badge"
            title="Nice-to-Have Skill"
            style={{ border: '1px dashed rgba(167, 139, 250, 0.3)', background: 'transparent', color: 'var(--text-secondary)' }}
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="card-footer">
        <div className="team-info flex-center gap-3">
          <div className="flex-center gap-1">
            <Users size={14} /> {project.teamSize}
          </div>
          <div className="flex-center gap-1">
            <Clock size={14} /> {project.commitment}
          </div>
        </div>
        <Link href={`/projects/${project.id}`}>
          <button className="btn-primary flex-center gap-1" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            View <ChevronRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );
}
