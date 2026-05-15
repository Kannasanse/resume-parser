'use client';
import { useEffect } from 'react';

export default function PortfolioViewTracker({ portfolioId }) {
  useEffect(() => {
    fetch('/api/v1/portfolios/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioId, eventType: 'page_view', referrer: document.referrer }),
    }).catch(() => {});
  }, [portfolioId]);
  return null;
}
