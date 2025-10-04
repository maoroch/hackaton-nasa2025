// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Space_Mono, Orbitron } from 'next/font/google'
import './globals.css'
import { AsteroidProvider } from '../components/context/AsteroidContext'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter'
})

const spaceMono = Space_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono'
})

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron'
})

export const metadata: Metadata = {
  title: 'Asteroid Impact Simulator',
  description: '3D simulation of asteroid impacts on Earth',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} ${orbitron.variable}`}>
      <body>
        <AsteroidProvider>
          {children}
        </AsteroidProvider>
      </body>
    </html>
  )
}