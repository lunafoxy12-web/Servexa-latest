import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';

// Handle expected transient network / offline reconnection states gracefully
if (typeof window !== 'undefined') {
  const isNetworkIssue = (msg: string) =>
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('unavailable') ||
    msg.includes('client is offline') ||
    msg.includes('Could not reach Cloud Firestore') ||
    msg.includes('Load failed');

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (isNetworkIssue(msg)) {
      event.preventDefault();
      console.debug('[Network / Resilient Mode]: Suppressed unhandled rejection:', msg);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || String(event || '');
    if (isNetworkIssue(msg)) {
      event.preventDefault();
      console.debug('[Network / Resilient Mode]: Suppressed error event:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
