import dashboard from './dashboard-html';

// Replaced at build time by vite.config.ts; the fallback is a local preview.
export const siteOrigin = process.env.MYTASK_SITE_ORIGIN || 'http://localhost:5173';
export const dashboardHtml = dashboard.replace(
  '"__MYTASK_SITE_ORIGIN__"', JSON.stringify(siteOrigin).replace(/</g, '\\u003c'),
);
