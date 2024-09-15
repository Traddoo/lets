export interface Project {
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
  reviews?: Review[];
}

export interface Review {
  rating: number;
}