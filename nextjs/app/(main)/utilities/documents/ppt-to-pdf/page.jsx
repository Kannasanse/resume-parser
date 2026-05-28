'use client';

import { ToolPageLayout } from '@/components/utilities/ToolPageLayout';

export default function PptToPdfPage() {
  return (
    <ToolPageLayout
      icon="📑"
      title="PowerPoint to PDF"
      description="Convert PowerPoint presentations (.pptx / .ppt) to PDF."
      parentHref="/utilities/documents"
      parentLabel="Document Tools"
    >
      <div className="space-y-6">
        <div className="p-6 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h2 className="text-lg font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-2">
            Coming Soon
          </h2>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-md mx-auto">
            PowerPoint to PDF conversion is on our roadmap. There is currently no reliable serverless solution for
            rendering .pptx files with full fidelity, so we are working on a robust implementation.
          </p>
        </div>

        <div className="p-4 bg-[#F4F8FC] dark:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[#D1DCE8] dark:border-white/8">
          <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-1">In the meantime</p>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            Open your presentation in{' '}
            <a
              href="https://slides.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#185FA5] hover:underline"
            >
              Google Slides
            </a>{' '}
            or{' '}
            <a
              href="https://www.libreoffice.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#185FA5] hover:underline"
            >
              LibreOffice
            </a>{' '}
            and use <strong>File → Export as PDF</strong> for a high-quality result.
          </p>
        </div>
      </div>
    </ToolPageLayout>
  );
}
