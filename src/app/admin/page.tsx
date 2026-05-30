"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Activity, Users, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      if (!user) {
        if (!authLoading) router.push('/');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: allProjects } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (allUsers) setUsersList(allUsers);
      if (allProjects) setProjectsList(allProjects);

      setLoading(false);
    }

    if (!authLoading) {
      loadAdminData();
    }
  }, [user, authLoading, router]);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Role update failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (!error) {
      setUsersList(usersList.filter(u => u.id !== userId));
    } else {
      alert("Delete failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjectsList(projectsList.filter(p => p.id !== projectId));
    } else {
      alert("Delete failed due to Supabase Security Rules (RLS). Run the SQL command provided below to fix this.");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-indigo)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
            Loading system controls...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <main className="main-content" style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={28} color="#EF4444" />
        </div>
        <div>
          <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '4px', lineHeight: 1.1 }}>System Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>Technical administration and user role management.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} color="var(--accent-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Registered Users</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{usersList.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="var(--accent-violet)" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 500 }}>Active Projects</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{projectsList.length}</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} color="var(--accent-indigo)" /> User Management
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>University</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Joined</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Role</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=6366f1&color=fff`} style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} alt="avatar" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{u.university || 'N/A'}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <select 
                      className="search-field" 
                      style={{ padding: '8px 12px', fontSize: '0.85rem', appearance: 'none', background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}
                      value={u.role || 'student'}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="btn-ghost" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '32px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={22} color="var(--accent-emerald)" /> Project Management
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Title</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Created</th>
                <th style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectsList.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>{p.type}</span>
                  </td>
                  <td style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => deleteProject(p.id)}
                      className="btn-ghost" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
