"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('student');
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchPendingCount() {
      if (user && pathname !== '/onboarding') {
        const { data: profile } = await supabase
          .from('users')
          .select('university, role')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          if (!profile.university && profile.role !== 'admin' && profile.role !== 'faculty') {
            router.push('/onboarding');
          }
          setUserRole(profile.role || 'student');
        }

        const { data: myProjects } = await supabase.from('projects').select('id').eq('founder_id', user.id);
        const myProjIds = myProjects ? myProjects.map(p => p.id) : [];

        if (myProjIds.length > 0) {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('project_id', myProjIds)
            .eq('status', 'Pending');
          if (count) setPendingCount(count);
        }
      }
    }

    fetchPendingCount();
  }, [user, pathname, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path: string) => pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand" onClick={closeMenu}>
        <div className="brand-icon">
          <Zap size={18} />
        </div>
        ProjectHub
      </Link>

      <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link href="/" className={isActive('/')} onClick={closeMenu}>IdeaBoard</Link>
        {user && (
          <>
            {userRole === 'admin' && (
              <Link href="/admin" className={isActive('/admin')} onClick={closeMenu}>
                Admin
              </Link>
            )}
            {userRole === 'faculty' && (
              <Link href="/faculty" className={isActive('/faculty')} onClick={closeMenu}>
                Faculty
              </Link>
            )}
            {(userRole !== 'admin' && userRole !== 'faculty') && (
              <>
                <Link href="/dashboard" className={isActive('/dashboard')} onClick={closeMenu} style={{ position: 'relative' }}>
                  Dashboard
                  {pendingCount > 0 && (
                    <span className="badge-notification">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link href="/chat" className={isActive('/chat')} onClick={closeMenu}>
                  Chat
                </Link>
                <Link href="/profile" className={isActive('/profile')} onClick={closeMenu}>Profile</Link>
              </>
            )}
          </>
        )}
        {user ? (
          <div className="nav-actions">
            {(userRole !== 'admin' && userRole !== 'faculty') && (
              <Link href="/post" onClick={closeMenu} style={{ width: '100%' }}>
                <button className="btn-glow" style={{ width: '100%', whiteSpace: 'nowrap' }}>Post Project</button>
              </Link>
            )}
            <button className="btn-ghost" onClick={handleLogout} style={{ width: '100%', whiteSpace: 'nowrap' }}>Log Out</button>
          </div>
        ) : (
          <Link href="/login" onClick={closeMenu} style={{ width: '100%' }}>
            <button className="btn-glow" style={{ width: '100%', whiteSpace: 'nowrap' }}>Log In</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
