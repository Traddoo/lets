"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../supabase-provider';
import Navbar from '../components/Navbar';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';

interface Tag {
  id: number;
  name: string;
}

interface SavedRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  list_repos: { list_id: number }[];
}

export default function MyLists() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([]);
  const [newTag, setNewTag] = useState({ name: '' });
  const [error, setError] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleSignInClick = () => {
    // Implement sign-in logic or navigation here
    console.log('Sign in clicked');
  };

  const fetchTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching tags:', error);
      setError('Failed to fetch tags');
    } else {
      setTags(data || []);
    }
  }, [supabase]);

  const fetchSavedRepos = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // First, get the user's 'Saved' list
      const { data: savedList, error: listError } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', 'Saved')
        .single();

      if (listError) throw listError;

      if (!savedList) {
        console.log('No saved list found for user');
        setSavedRepos([]);
        return;
      }

      // Then, get the repos in that list
      const { data, error } = await supabase
        .from('list_repos')
        .select(`
          repo_id,
          repos:repos(
            id,
            name,
            description,
            url
          )
        `)
        .eq('list_id', savedList.id);

      if (error) throw error;

      const savedRepos = data.map(item => ({
        id: item.repos.id,
        name: item.repos.name,
        description: item.repos.description,
        url: item.repos.url,
        list_repos: [{ list_id: savedList.id }]
      }));

      setSavedRepos(savedRepos);
    } catch (error) {
      console.error('Error fetching saved repos:', error);
      setError('Failed to fetch saved repos');
    }
  }, [supabase, session]);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        fetchTags();
        fetchSavedRepos();
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchTags();
        fetchSavedRepos();
      } else {
        setTags([]);
        setSavedRepos([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchTags, fetchSavedRepos]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ name: newTag.name, user_id: session?.user.id }])
        .select();

      if (error) throw error;

      if (data) {
        setTags([...tags, data[0]]);
        setNewTag({ name: '' });
        setIsAddingTag(false);
        console.log('Tag created successfully:', data[0]);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag. Please try again.');
    }
  };

  const handleAddTagToRepo = async (repoId: number, tagId: number) => {
    try {
      const { error } = await supabase
        .from('list_repos')
        .upsert({ repo_id: repoId, list_id: tagId });

      if (error) throw error;

      setSavedRepos(prevRepos => prevRepos.map(repo => {
        if (repo.id === repoId) {
          const updatedListRepos = [...(repo.list_repos || []), { list_id: tagId }];
          return { ...repo, list_repos: updatedListRepos };
        }
        return repo;
      }));

    } catch (error) {
      console.error('Error adding tag to repo:', error);
      setError('Failed to add tag to repo');
    }
  };

  const handleRemoveTagFromRepo = async (repoId: number, tagId: number) => {
    try {
      const { error } = await supabase
        .from('list_repos')
        .delete()
        .match({ repo_id: repoId, list_id: tagId });

      if (error) throw error;

      setSavedRepos(prevRepos => prevRepos.map(repo => {
        if (repo.id === repoId) {
          const updatedListRepos = repo.list_repos?.filter(lr => lr.list_id !== tagId) || [];
          return { ...repo, list_repos: updatedListRepos };
        }
        return repo;
      }));

    } catch (error) {
      console.error('Error removing tag from repo:', error);
      setError('Failed to remove tag from repo');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .match({ id: tagId });

      if (error) throw error;

      setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
      console.log('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={() => {}} onSignInClick={handleSignInClick} />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Repos</h1>
          <button
            onClick={() => setIsAddingTag(!isAddingTag)}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
          >
            {isAddingTag ? 'Cancel' : 'Add Tag'}
          </button>
        </div>
        
        {isAddingTag && (
          <form onSubmit={handleCreateTag} className="mb-8">
            <input
              type="text"
              placeholder="Tag Name"
              value={newTag.name}
              onChange={(e) => setNewTag({ name: e.target.value })}
              className="w-full p-2 mb-2 border rounded text-gray-800"
            />
            <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
              Create Tag
            </button>
          </form>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Existing Tags</h2>
          <div className="flex flex-wrap">
            {tags.map(tag => (
              <div key={tag.id} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                {tag.name}
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          {savedRepos.map(repo => (
            <div key={repo.id} className="bg-white p-4 mb-4 rounded shadow">
              <div className="flex justify-between items-start">
                <div>
                  <Link href={`/repo/${repo.id}`} className="font-semibold text-blue-600 hover:underline">
                    <h3>{repo.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-600">{repo.description}</p>
                </div>
              </div>
              <div className="mt-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => repo.list_repos?.some(lr => lr.list_id === tag.id)
                      ? handleRemoveTagFromRepo(repo.id, tag.id)
                      : handleAddTagToRepo(repo.id, tag.id)
                    }
                    className={`mr-2 mb-2 px-2 py-1 text-sm rounded ${
                      repo.list_repos?.some(lr => lr.list_id === tag.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
