"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import BackButton from '../../../../components/BackButton';

export default function TeamChat({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data: project } = await supabase
        .from('projects')
        .select('founder_id, title')
        .eq('id', id)
        .single();
        
      if (!project) {
        router.push('/');
        return;
      }

      let hasAccess = project.founder_id === session.user.id;
      
      if (!hasAccess) {
        const { data: app } = await supabase
          .from('applications')
          .select('status')
          .eq('project_id', id)
          .eq('applicant_id', session.user.id)
          .single();
          
        if (app?.status === 'Accepted') {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        router.push(`/projects/${id}`);
        return;
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select(`
          id, content, created_at, user_id,
          users!messages_user_id_fkey ( full_name, avatar_url )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages(msgs);
        await supabase.from('chat_read_receipts').upsert({
          user_id: session.user.id,
          project_id: id,
          last_read_at: new Date().toISOString()
        });
      }
      
      setLoading(false);
    }
    
    loadData();
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat_${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` },
        async (payload) => {
          const { data: fullMsg } = await supabase
            .from('messages')
            .select(`
              id, content, created_at, user_id,
              users!messages_user_id_fkey ( full_name, avatar_url )
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullMsg) {
            setMessages((prev) => [...prev, fullMsg]);
            await supabase.from('chat_read_receipts').upsert({
              user_id: user.id,
              project_id: id,
              last_read_at: new Date().toISOString()
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    setSending(true);
    const msg = newMessage;
    setNewMessage("");

    const { error } = await supabase
      .from('messages')
      .insert({
        project_id: id,
        user_id: user.id,
        content: msg.trim()
      });
      
    if (error) {
      setNewMessage(msg);
      alert("Failed to send message: " + error.message);
    }
    setSending(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>Connecting to secure chat workspace...</div>;
  }

  return (
    <main className="main-content" style={{ maxWidth: '800px', paddingTop: '100px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <BackButton href="/chat" text="Back to Chat Directory" />
        <h1 style={{ fontSize: '2rem' }}>Team Workspace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time team chat.</p>
      </div>
      
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, marginBottom: '40px' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.user_id === user.id;
              
              return (
                <div key={msg.id || idx} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-end' }}>
                  {!isMe && (
                    <img 
                      src={msg.users?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.users?.full_name || 'User')}&background=6366f1&color=fff`} 
                      alt={msg.users?.full_name} 
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }} 
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    {!isMe && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', marginLeft: '4px' }}>{msg.users?.full_name}</span>}
                    <div style={{ 
                      background: isMe ? 'var(--accent-primary)' : 'var(--bg-surface-hover)', 
                      color: isMe ? '#fff' : 'var(--text-primary)',
                      padding: '12px 16px', 
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      fontSize: '0.95rem',
                      lineHeight: 1.5
                    }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Type your message..." 
              style={{ flex: 1, padding: '14px 16px', borderRadius: '24px' }}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={sending || !newMessage.trim()} 
              className="btn-primary" 
              style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
        
      </div>
    </main>
  );
}
