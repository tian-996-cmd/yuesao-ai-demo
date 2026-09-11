import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoApp } from '@/app/page';
import '../styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DemoApp />
  </StrictMode>,
);
