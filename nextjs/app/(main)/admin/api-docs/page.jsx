'use client';
import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(linkEl);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      window.SwaggerUIBundle({
        url: '/openapi.json',
        domNode: containerRef.current,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        filter: true,
        tryItOutEnabled: false,
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(linkEl);
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-6 border-b border-[#D1DCE8]">
        <h1 className="text-2xl font-bold text-[#2C2C2A]">API Documentation</h1>
        <p className="text-sm text-[#6B7280] mt-1">Interactive reference for all Proflect API endpoints.</p>
      </div>
      <div ref={containerRef} />
    </div>
  );
}
