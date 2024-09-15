"use client";

import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onSignInClick: () => void;
}

export default function Navbar({ onSearch, onSignInClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="bg-gray-100 p-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button 
            className="text-gray-800 mr-4 focus:outline-none"
            onClick={toggleMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="text-gray-800 text-xl font-bold">ReplRepo</Link>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center">
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-white text-gray-800 px-3 py-1 rounded-md mr-4 border border-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
      {isMenuOpen && (
        <div className="mt-4">
          <Link href="/my-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            My Profile
          </Link>
          <Link href="/my-lists" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Saved Repos
          </Link>
          <Link href="/submit-repo" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Submit Repo / Template
          </Link>
          <button onClick={onSignInClick} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Sign In / Sign Up
          </button>
        </div>
      )}
    </nav>
  );
}
