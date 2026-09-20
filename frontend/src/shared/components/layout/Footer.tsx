import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 w-full">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Skyline<span className="text-amber-400">Living</span></span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Sri Lanka's premier architectural residences and luxury sky penthouses with fully verified legal deeds.
          </p>
          <div className="flex items-center gap-3 mt-6 text-slate-400">
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:text-amber-400 transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:text-amber-400 transition">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:text-amber-400 transition">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:text-amber-400 transition">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Explore</h4>
          <ul className="space-y-2.5 text-xs md:text-sm">
            <li><Link to="/apartments" className="hover:text-amber-400 transition">All Apartments</Link></li>
            <li><Link to="/apartments?type=Penthouse" className="hover:text-amber-400 transition">Sky Penthouses</Link></li>
            <li><Link to="/compare" className="hover:text-amber-400 transition">Compare Units</Link></li>
            <li><Link to="/register" className="hover:text-amber-400 transition">Create Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Company</h4>
          <ul className="space-y-2.5 text-xs md:text-sm">
            <li><Link to="/" className="hover:text-amber-400 transition">About Us</Link></li>
            <li><Link to="/reviews" className="hover:text-amber-400 transition">Resident Reviews</Link></li>
            <li><a href="#" className="hover:text-amber-400 transition">Terms of Service</a></li>
            <li><a href="#" className="hover:text-amber-400 transition">Privacy Policy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact Us</h4>
          <ul className="space-y-3 text-xs md:text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>No. 45, Galle Road, Colombo 03, Sri Lanka</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+94 11 234 5678</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>info@skylineliving.lk</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 Skyline Living. All rights reserved.</p>
        <p>Ultra-Luxury Real Estate Web Application</p>
      </div>
    </footer>
  );
}