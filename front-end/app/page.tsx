import Earth from '@/components/Earth';
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="w-full h-screen">
      <Navbar />
      <Earth className="w-full h-full" />
    </main>
  );
}