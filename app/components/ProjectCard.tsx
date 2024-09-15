import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
  tags: string[] | null;
  upvotes: number;
  type: "GitHub" | "Replit";
  url: string;
  favorites_count: number;
  averageRating: number | null;
  owner: string;
}

interface ProjectCardProps {
  project: Project;
  handleSaveRepo: (project: Project) => Promise<void>;
}

export default function ProjectCard({ project, handleSaveRepo }: ProjectCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  const logoSrc = project.type === "Replit" 
    ? "https://replit.com/public/images/logo-small.png"
    : "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png";

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await handleSaveRepo(project);
    } catch (error) {
      console.error('Error saving repo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-auto flex flex-col relative">
      <Link href={`/repo/${project.id}`} className="block flex-grow">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center mb-2">
            <Image
              src={logoSrc}
              alt={`${project.type} logo`}
              width={24}
              height={24}
              className="rounded-full mr-2"
            />
            <div>
              <h3 className="text-base font-semibold text-white truncate">{project.name}</h3>
              <p className="text-xs text-gray-400">{project.type}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-2 flex-grow overflow-hidden line-clamp-2">{project.description}</p>
          {Array.isArray(project.tags) && project.tags.length > 0 && (
            <div className="flex flex-wrap mb-2">
              {project.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-gray-700 text-gray-300 rounded-full px-2 py-1 mr-1 mb-1">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mt-auto">
            {project.averageRating !== null && renderStars(project.averageRating)}
            <span className="text-sm text-gray-400">Owner: {project.owner}</span>
          </div>
        </div>
      </Link>
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="absolute bottom-2 right-2 p-1 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    </div>
  );
}


