import Navbar from "@/components/Navbar";
import Main from '@/components/Main';
import Cursor from '@/components/Сursor'
import DebugInfo from "@/components/DebugInfo";
export default function Home() {
  return (
    <main className="w-full h-screen">
      <Navbar />
      <Cursor />
      <Main />
      <DebugInfo />
    </main>
  );
}