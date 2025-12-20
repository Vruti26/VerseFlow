'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
  const [apiKey, setApiKey] = useState('Loading...');

  useEffect(() => {
    // We use a state to ensure this runs on the client after hydration
    setApiKey(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'THE API KEY IS UNDEFINED OR NOT SET!');
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}>
      <h1>Environment Variable Debug</h1>
      <p>This page displays the value of the environment variable as seen by your live application.</p>
      <hr style={{ margin: '1rem 0' }} />
      <h2>NEXT_PUBLIC_FIREBASE_API_KEY:</h2>
      <p style={{ color: 'red', wordBreak: 'break-all', background: '#f0f0f0', padding: '1rem' }}>
        {apiKey}
      </p>
      <hr style={{ margin: '1rem 0' }} />
      <h3>Next Steps:</h3>
      <ol>
        <li>
          Go to your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Project Settings</a>.
        </li>
        <li>Find the "Web API Key" for your app.</li>
        <li>Carefully compare the key from Firebase with the red value displayed on this page.</li>
        <li>If they do not match exactly, you must update the `NEXT_PUBLIC_FIREBASE_API_KEY` in your Vercel project settings and redeploy.</li>
      </ol>
    </div>
  );
}
