"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, Suspense } from "react";
import Navbar from './components/Navbar';
import { useSupabase } from './supabase-provider';
import { Session } from '@supabase/supabase-js';
import ScrollableProjectList from './components/ScrollableProjectList';
import { useSearchParams, useRouter } from 'next/navigation';
import { Project } from './interfaces/Project';

interface Review {
  rating: number;
}

function HomeContent() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [newListings, setNewListings] = useState<Project[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchProjects = useCallback(async (searchQuery = '') => {
    try {
      let featuredQuery = supabase
        .from('repos')
        .select(`
          *,
          tags,
          reviews(rating)
        `)
        .order('created_at', { ascending: true })
        .limit(12);

      let newListingsQuery = supabase
        .from('repos')
        .select(`
          *,
          tags,
          reviews(rating)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        const searchFilter = `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,owner.ilike.%${searchQuery}%`;
        featuredQuery = featuredQuery.or(searchFilter);
        newListingsQuery = newListingsQuery.or(searchFilter);
      }

      const [{ data: featuredData, error: featuredError }, { data: newListingsData, error: newListingsError }] = await Promise.all([
        featuredQuery,
        newListingsQuery.limit(12)
      ]);

      if (featuredError) throw featuredError;
      if (newListingsError) throw newListingsError;

      const processProjects = (projects: Project[]) => projects.map(project => {
        const ratings = project.reviews?.map((review: Review) => review.rating) || [];
        const averageRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;
        return {
          ...project,
          averageRating: averageRating
        };
      });

      setTopProjects(processProjects(featuredData));
      setNewListings(processProjects(newListingsData));
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects. Please try again.');
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const fetchSessionAndProjects = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) setSession(session);
        await fetchProjects();
      } catch (err) {
        console.error('Error fetching session and projects:', err);
        if (isMounted) setError('Failed to load initial data. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSessionAndProjects();

    return () => {
      isMounted = false;
    };
  }, [supabase, fetchProjects]);

  useEffect(() => {
    const searchQuery = searchParams.get('search') || '';
    fetchProjects(searchQuery);
  }, [searchParams, fetchProjects]);

  const handleSearch = (query: string) => {
    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const handleSignInModalOpen = () => {
    setIsSignInModalOpen(true);
  };

  const handleSignInModalClose = () => {
    setIsSignInModalOpen(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to sign in...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error('Error signing in:', error.message);
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError('Failed to sign in: ' + error.message);
        }
      } else {
        console.log('Signed in successfully', data);
        setSession(data.session);
        await fetchProjects();
        handleSignInModalClose(); // Close the modal after successful sign-in
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to sign up...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) {
        console.error('Error signing up:', error.message);
        setError('Failed to sign up: ' + error.message);
      } else {
        console.log('Signed up successfully', data);
        setError('Signed up successfully. Please check your email for a confirmation link. Click the link to confirm your email and sign in automatically.');
      }
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSaveRepo = async (project: Project) => {
    if (!session) {
      console.log('User not logged in');
      return;
    }

    try {
      // Increment upvotes
      const { error: updateError } = await supabase
        .rpc('increment_upvotes', { repo_id_param: project.id });

      if (updateError) throw updateError;

      // Fetch or create the user's 'Saved' list
      let savedListId: number;
      const { data: savedList, error: listError } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', 'Saved')
        .single();

      if (listError) {
        if (listError.code === 'PGRST116') {
          // If 'Saved' list doesn't exist, create it
          const { data: newList, error: createError } = await supabase
            .from('lists')
            .insert({ user_id: session.user.id, name: 'Saved' })
            .select('id')
            .single();

          if (createError) throw createError;
          savedListId = newList.id;
        } else {
          throw listError;
        }
      } else {
        savedListId = savedList.id;
      }

      // Check if the repo is already saved
      const { data: existingRepo, error: checkError } = await supabase
        .from('list_repos')
        .select('*')
        .eq('list_id', savedListId)
        .eq('repo_id', project.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected if the repo isn't saved yet
        throw checkError;
      }

      if (!existingRepo) {
        // Only insert if the repo isn't already saved
        const { error: saveError } = await supabase
          .from('list_repos')
          .insert({ list_id: savedListId, repo_id: project.id });

        if (saveError) throw saveError;
      }

      // Update local state
      const updateProject = (p: Project) => ({
        ...p,
        upvotes: (p.upvotes || 0) + 1
      });

      setTopProjects(prevProjects => 
        prevProjects.map(p => p.id === project.id ? updateProject(p) : p)
      );
      setNewListings(prevListings => 
        prevListings.map(p => p.id === project.id ? updateProject(p) : p)
      );

      console.log('Repo saved and upvoted successfully');
    } catch (error) {
      console.error('Error saving repo:', error);
      setError('Failed to save repo. Please try again.');
    }
  };

  const githubLogoSrc = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";
  const replitLogoSrc = "https://replit.com/public/images/logo-small.png";

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={handleSearch} onSignInClick={handleSignInModalOpen} />
      <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <>
            <header className="text-center mb-20">
              <h1 className="text-5xl font-bold mb-4 text-gray-800">
                Discover the best
                <br />
                open-source templates
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                A crowdsourced list of the best <br />
                Github Repos &amp; Replit Templates
              </p>
              <div className="flex justify-center items-center space-x-8">
                <Image
                  src={githubLogoSrc}
                  alt="GitHub Logo"
                  width={50}
                  height={50}
                  className="opacity-80 rounded-full"
                />
                <Image
                  src={replitLogoSrc}
                  alt="Replit Logo"
                  width={50}
                  height={50}
                  className="opacity-80"
                />
              </div>
            </header>

            <main>
              <ScrollableProjectList 
                projects={topProjects} 
                title="Featured" 
                handleSaveRepo={handleSaveRepo}
              />
              <ScrollableProjectList 
                projects={newListings} 
                title="New Listings" 
                handleSaveRepo={handleSaveRepo}
              />
            </main>
          </>
        )}
      </div>

      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Sign In / Sign Up</h3>
              <div className="mt-2 px-7 py-3">
                <form onSubmit={handleSignIn}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline"
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                      Password
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                      id="password"
                      type="password"
                      placeholder="******************"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                    >
                      Sign In
                    </button>
                    <button
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      type="button"
                      onClick={handleSignUp}
                    >
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleSignInModalClose}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
