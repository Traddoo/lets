"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../supabase-provider';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { Session, User } from '@supabase/supabase-js';
import { Project } from '../interfaces/Project';

interface UserData {
  username: string;
  email: string;
  // Add other user data fields as needed
}

export default function MyProfile() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userRepos, setUserRepos] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      // If the user doesn't exist, create a new user record
      if (error.code === 'PGRST116') {
        const { data: userData, error: insertError } = await supabase
          .from('users')
          .insert({ id: userId, email: user?.email })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user data:', insertError);
        } else {
          setUserData(userData);
        }
      }
    } else {
      setUserData(data);
    }
  }, [supabase, user]);

  const fetchUserRepos = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('repos')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user repos:', error);
    } else {
      setUserRepos(data || []);
    }
  }, [supabase]);

  useEffect(() => {
    const fetchSessionAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          fetchUserData(session.user.id),
          fetchUserRepos(session.user.id)
        ]);
      }
      setLoading(false);
    };

    fetchSessionAndUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          fetchUserData(session.user.id),
          fetchUserRepos(session.user.id)
        ]);
      } else {
        setUserData(null);
        setUserRepos([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchUserData, fetchUserRepos]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
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

  if (loading) {
    return <div className="bg-white min-h-screen">Loading...</div>;
  }

  if (!session || !user) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-4 text-gray-800">My Profile</h1>
        {userData && (
          <div className="mb-6">
            <p className="text-gray-700">Username: {userData.username}</p>
            <p className="text-gray-700">Email: {userData.email}</p>
            {/* Add other user data fields here */}
          </div>
        )}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">My Uploaded Repos</h2>
          {userRepos.length > 0 ? (
            <ul className="space-y-2">
              {userRepos.map((repo) => (
                <li key={repo.id} className="bg-gray-50 p-4 rounded shadow">
                  <Link href={`/repo/${repo.id}`} className="text-blue-600 hover:underline">
                    <h3 className="font-semibold">{repo.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600">{repo.description}</p>
                  <p className="text-sm text-gray-500">Type: {repo.type}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700">You haven't uploaded any repos yet.</p>
          )}
        </div>
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
