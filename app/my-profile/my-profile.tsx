"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../supabase-provider';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';

interface UserData {
  username: string;
  email: string;
  // Add other user data fields as needed
}

export default function MyProfile() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
    } else {
      setUserData(data);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      }
    };

    fetchSession();
  }, [supabase, fetchUserData]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      setSession(null);
      setUserData(null);
    }
  };

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search query:', query);
  };

  const handleSignInClick = () => {
    // Implement sign-in logic or navigation
    console.log('Sign in clicked');
  };

  if (!session) {
    return (
      <div>
        <Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-4">My Profile</h1>
        {userData && (
          <div>
            <p>Username: {userData.username}</p>
            <p>Email: {userData.email}</p>
            {/* Add other user data fields here */}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign Out
        </button>
        <div className="mt-8">
          <Link href="/my-lists" className="text-blue-500 hover:underline">
            View My Lists
          </Link>
        </div>
      </div>
    </div>
  );
}
