'use client';
import { useState, useEffect, useRef } from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
    }}>
      <div style={{
        maxWidth: '88%', padding: '8px 12px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? 'var(--c-primary)' : 'rgba(255,255,255,0.06)',
        border: isUser ? 'none' : '1px solid var(--c-border)',
        fontSize: 12, lineHeight: 1.6, color: isUser ? 'white' : 'var(--c-text)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 12px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--c-text-muted)',
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }`}</style>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  'Summarise the key concepts from my sources',
  'What are the most important things to understand about this topic?',
  'What gaps are there in my current sources?',
  'Generate 5 quiz questions from my sources',
];

export default function CourseChat({ courseId, skillName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`/api/v1/courses/${courseId}/chat`)
      .then(r => r.json())
      .then(d => {
        setMessages(d.messages || []);
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/v1/courses/${courseId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      const reply = data.reply || 'Something went wrong.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Network error — please try again.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const showSuggested = historyLoaded && messages.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px', borderBottom: '1px solid var(--c-border)', flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text)' }}>Chat with sources</div>
        <div style={{ fontSize: 10, color: 'var(--c-text-muted)', marginTop: 1 }}>
          Answers grounded in your course material
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
        {showSuggested ? (
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 10 }}>
              Try asking…
            </div>
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 10px', marginBottom: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--c-border)', borderRadius: 8,
                  fontSize: 11, color: 'var(--c-text-muted)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,95,165,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : (
          messages.map(msg => <ChatMessage key={msg.id || msg.created_at} message={msg} />)
        )}
        {loading && <ThinkingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 10px', borderTop: '1px solid var(--c-border)',
        display: 'flex', gap: 7, flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
          }}
          placeholder="Ask anything about your sources…"
          rows={2}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--c-border)', borderRadius: 8,
            padding: '7px 10px', fontSize: 12, color: 'var(--c-text)',
            resize: 'none', outline: 'none', lineHeight: 1.5,
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            background: !input.trim() || loading ? 'rgba(255,255,255,0.06)' : 'var(--c-primary)',
            border: 'none', borderRadius: 8, padding: '0 12px',
            color: 'white', cursor: !input.trim() || loading ? 'default' : 'pointer',
            fontSize: 16, flexShrink: 0, transition: 'background 0.15s',
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
