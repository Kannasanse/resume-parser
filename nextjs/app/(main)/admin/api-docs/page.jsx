'use client';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-[#2C2C2A] mb-1">API Documentation</h1>
        <p className="text-sm text-[#6B7280] mb-6">Interactive reference for all Proflect API endpoints.</p>
        <SwaggerUI
          url="/openapi.json"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          tryItOutEnabled={false}
          filter
        />
      </div>
    </div>
  );
}
