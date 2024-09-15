"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import ReviewSection from '../../components/ReviewSection';
import { useSupabase } from '../../supabase-provider';
import { Project } from '../../interfaces/Project';

export default function RepoPage() {
  const { supabase } = useSupabase();
  const params = useParams();
  const [repo, setRepo] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('repos')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      
      // Ensure tags is always an array
      const processedData = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : 
              (typeof data.tags === 'string' ? data.tags.split(',').map(tag => tag.trim()) : [])
      };
      
      setRepo(processedData);
    } catch (error) {
      console.error('Error fetching repo:', error);
      setError('Failed to fetch repo');
    } finally {
      setLoading(false);
    }
  }, [supabase, params.id]);

  useEffect(() => {
    fetchRepo();
  }, [fetchRepo]);

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search query:', query);
  };

  const handleSignInClick = () => {
    // Implement sign-in logic or navigation
    console.log('Sign in clicked');
  };

  const handleReviewSubmitted = () => {
    // Refresh the repo data after a new review is submitted
    fetchRepo();
  };

  if (loading) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} /><div>Loading...</div></div>;
  if (error) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} /><div>Error: {error}</div></div>;
  if (!repo) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} /><div>Repo not found</div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={handleSearch} onSignInClick={handleSignInClick} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">{repo.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{repo.description}</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{repo.type}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">{repo.owner}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">URL</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                    {repo.url}
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Upvotes</dt>
                <dd className="mt-1 text-sm text-gray-900">{repo.upvotes}</dd>
              </div>
              {repo.tags && repo.tags.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {repo.tags.map((tag, index) => (
                      <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <ReviewSection repoId={repo.id} onReviewSubmitted={handleReviewSubmitted} />
      </div>
    </div>
  );
}
