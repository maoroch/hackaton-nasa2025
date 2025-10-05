// components/Providers.tsx
"use client";

import { AsteroidProvider } from './context/AsteroidContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AsteroidProvider>
      {children}
    </AsteroidProvider>
  );
}