"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Activity, Users, Settings } from 'lucide-react';
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
    return <div className="flex-center p-4 text-muted" style={{ minHeight: '60vh' }}>Loading system controls...</div>;
  }

  return (
    <main className="main-content animate-fade-in" style={{ maxWidth: '1000px' }}>
      <div className="flex-center gap-2 mb-4" style={{ justifyContent: 'flex-start' }}>
        <div className="flex-center" style={{ background: 'rgba(239, 68, 68, 0.1)', width: '48px', height: '48px', borderRadius: '12px', color: '#EF4444' }}>
          <Settings size={24} />
        </div>
        <div>
          <h1 className="mb-0" style={{ fontSize: '2rem', fontWeight: 700 }}>System Control Panel</h1>
          <p className="text-muted">Technical administration and user role management.</p>
        </div>
      </div>

      <div className="grid-auto mb-4">
        <div className="glass-panel flex-center gap-2 p-3" style={{ justifyContent: 'flex-start' }}>
          <div className="p-2" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3B82F6' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="text-sm text-muted mb-1">Registered Users</div>
            <div className="text-bold" style={{ fontSize: '1.2rem' }}>{usersList.length}</div>
          </div>
        </div>

        <div className="glass-panel flex-center gap-2 p-3" style={{ justifyContent: 'flex-start' }}>
          <div className="p-2" style={{ background: 'rgba(168, 85, 247, 0.1)', borderRadius: '12px', color: '#A855F7' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="text-sm text-muted mb-1">Active Projects</div>
            <div className="text-bold" style={{ fontSize: '1.2rem' }}>{projectsList.length}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel mb-4 p-4">
        <h2 className="mb-3 flex-center gap-1" style={{ fontSize: '1.25rem', justifyContent: 'flex-start' }}>
          <Shield size={20} /> User Management
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-sm text-muted" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>University</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Joined</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Role</th>
                <th style={{ padding: '12px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="avatar" />
                      <span className="text-bold">{u.full_name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="text-muted" style={{ padding: '16px 12px' }}>{u.university || 'N/A'}</td>
                  <td className="text-muted" style={{ padding: '16px 12px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <select 
                      className="search-input" 
                      style={{ padding: '8px 12px', fontSize: '0.9rem', appearance: 'none' }}
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
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 className="mb-3 flex-center gap-1" style={{ fontSize: '1.25rem', justifyContent: 'flex-start' }}>
          <Activity size={20} /> Project Management
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr className="text-sm text-muted" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px', fontWeight: 500 }}>Project Title</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '12px', fontWeight: 500 }}>Created</th>
                <th style={{ padding: '12px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectsList.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="text-bold" style={{ padding: '16px 12px' }}>{p.title}</td>
                  <td className="text-muted" style={{ padding: '16px 12px' }}>{p.type}</td>
                  <td className="text-muted" style={{ padding: '16px 12px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => deleteProject(p.id)}
                      className="btn-secondary text-sm" 

                      style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      Delete
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
