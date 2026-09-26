import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <Navbar />
      <main className="flex-1 bg-[#f8fafc]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}