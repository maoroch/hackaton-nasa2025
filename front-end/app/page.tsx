import Navbar from "@/components/Navbar";
import Earth from '@/components/Earth';

export default function Home() {
  return (
    <main className="w-full h-screen">
      <Navbar />
      <Earth className="w-full h-full" />
    </main>
  );
}