"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ href, text }: { href: string, text: string }) {
  const router = useRouter();

  if (href === 'back') {
    return (
      <button 
        onClick={() => router.back()} 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '32px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
      >
        <ArrowLeft size={16} /> {text}
      </button>
    );
  }

  return (
    <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
      <ArrowLeft size={16} /> {text}
    </Link>
  );
}
