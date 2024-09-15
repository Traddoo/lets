import { useState } from 'react';
import ProjectCard from './ProjectCard';

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

interface ScrollableProjectListProps {
  projects: Project[];
  title: string;
  handleSaveRepo: (project: Project) => Promise<void>;
}

export default function ScrollableProjectList({ projects, title, handleSaveRepo }: ScrollableProjectListProps) {
  const [startIndex, setStartIndex] = useState(0);
  const projectsPerPage = 6; // 2 rows of 3 projects

  const nextProjects = () => {
    setStartIndex((prevIndex) => 
      Math.min(prevIndex + projectsPerPage, projects.length - projectsPerPage)
    );
  };

  const previousProjects = () => {
    setStartIndex((prevIndex) => Math.max(prevIndex - projectsPerPage, 0));
  };

  return (
    <div className="mb-12">
      <div className="inline-block bg-gray-200 rounded-lg px-4 py-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.slice(startIndex, startIndex + projectsPerPage).map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project}
              handleSaveRepo={handleSaveRepo} 
            />
          ))}
        </div>
        {startIndex > 0 && (
          <button
            onClick={previousProjects}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition-colors duration-200"
            aria-label="Previous projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {startIndex < projects.length - projectsPerPage && (
          <button
            onClick={nextProjects}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white text-black p-2 rounded-full shadow-md hover:bg-gray-200 transition-colors duration-200"
            aria-label="Next projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
