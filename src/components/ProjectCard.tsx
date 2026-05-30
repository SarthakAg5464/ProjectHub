"use client";

import React from 'react';
import { Clock, Users, ChevronRight, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project, index }: { project: any, index: number }) {
  return (
    <div
      className="glass-card glow-border animate-fade-in"
      style={{
        animationDelay: `${(index * 0.08) + 0.2}s`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        padding: 0
      }}
    >
      <div style={{ padding: '24px 24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="flex-between align-start">
          <div style={{ flex: 1 }}>
            <div className="project-type" style={{ marginBottom: '6px' }}>{project.type}</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.3, color: 'var(--text-primary)' }}>{project.title}</h3>
          </div>
          <img
            src={project.founderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(project.founder || 'User')}&background=6366f1&color=fff`}
            alt={project.founder}
            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '2px solid rgba(99,102,241,0.25)', flexShrink: 0, marginLeft: '14px' }}
          />
        </div>

        {(project.matchScore > 0 || project.endorsementCount > 0) && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {project.matchScore > 0 && (
              <span className="badge badge-success">
                {project.matchedSkills?.length}/{project.skillsRequired?.length} Skills Match
              </span>
            )}
            {project.endorsementCount > 0 && (
              <span className="badge badge-purple">
                <Award size={12} /> Endorsed
              </span>
            )}
          </div>
        )}

        <p className="project-desc">{project.description}</p>

        <div className="skills-list">
          {project.skillsRequired?.map((skill: string) => (
            <span
              key={`req-${skill}`}
              className={`skill-badge ${project.matchedSkills?.includes(skill) ? 'match' : ''}`}
            >
              {skill}
            </span>
          ))}
          {project.skillsNice?.map((skill: string) => (
            <span
              key={`nice-${skill}`}
              className="skill-badge"
              style={{ borderStyle: 'dashed', color: 'var(--text-dim)' }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <div className="team-info">
          <span className="flex-center gap-1"><Users size={14} /> {project.teamSize}</span>
          <span className="flex-center gap-1"><Clock size={14} /> {project.commitment}</span>
        </div>
        <Link href={`/projects/${project.id}`}>
          <button className="btn-glow flex-center gap-1" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
            View <ChevronRight size={14} />
          </button>
        </Link>
      </div>
    </div>
  );
}
