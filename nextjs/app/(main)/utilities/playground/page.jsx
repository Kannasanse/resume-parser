'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CodePlayground } from '@/components/playground/CodePlayground';

function PlaygroundPage() {
  const params   = useSearchParams();
  const lang     = params.get('lang') || 'web';
  const language = ['web', 'python', 'sql'].includes(lang) ? lang : 'web';

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--c-text, #E8EFF7)' }}>
          Code Playground
        </h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-muted, #6B7280)', margin: '4px 0 0' }}>
          HTML/CSS/JS · Python · SQL — runs entirely in your browser
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CodePlayground initialLanguage={language} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PlaygroundPage />
    </Suspense>
  );
}
