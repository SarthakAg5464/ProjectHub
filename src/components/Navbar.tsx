"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchPendingCount() {
      if (user && pathname !== '/onboarding') {
        const { data: profile } = await supabase
          .from('users')
          .select('university')
          .eq('id', user.id)
          .single();
          
        if (profile && !profile.university) {
          router.push('/onboarding');
        }

        const { data: myProjects } = await supabase.from('projects').select('id').eq('founder_id', user.id);
        if (myProjects && myProjects.length > 0) {
          const projectIds = myProjects.map(p => p.id);
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .in('project_id', projectIds)
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

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand" onClick={closeMenu}>
        <div className="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12l5.25 5 2.625-3" />
            <path d="M8 12l5.25 5L22 7" />
            <path d="M16 7l-3.5 4" />
          </svg>
        </div>
        ProjectHub
      </Link>

      {/* Mobile Toggle Button */}
      <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isMobileMenuOpen ? (
            <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
          ) : (
            <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
          )}
        </svg>
      </button>

      <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link href="/" className="nav-link" onClick={closeMenu}>IdeaBoard</Link>
        {user && (
          <Link href="/dashboard" className="nav-link" onClick={closeMenu} style={{ position: 'relative' }}>
            Dashboard
            {pendingCount > 0 && (
              <span className="badge-notification">
                {pendingCount}
              </span>
            )}
          </Link>
        )}
        {user && <Link href="/profile" className="nav-link" onClick={closeMenu}>Profile</Link>}
        {user ? (
          <div className="nav-actions">
            <Link href="/post" onClick={closeMenu} style={{ width: '100%' }}>
              <button className="btn-primary" style={{ width: '100%', whiteSpace: 'nowrap' }}>Post Project</button>
            </Link>
            <button className="btn-secondary" onClick={handleLogout} style={{ width: '100%', whiteSpace: 'nowrap' }}>Log Out</button>
          </div>
        ) : (
          <Link href="/login" onClick={closeMenu} style={{ width: '100%' }}>
            <button className="btn-primary" style={{ width: '100%', whiteSpace: 'nowrap' }}>Log In</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
