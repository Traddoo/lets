'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../supabase-provider';

interface Review {
  id: number;
  content: string;
  rating: number;
  created_at: string;
}

interface ReviewSectionProps {
  repoId: number;
  onReviewSubmitted: () => void;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export default function ReviewSection({ repoId, onReviewSubmitted }: ReviewSectionProps) {
  const { supabase } = useSupabase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('repo_id', repoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else if (data) {
      setReviews(data);
    }
  }, [supabase, repoId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.trim() === '' || newRating === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert([
          { 
            repo_id: repoId, 
            content: newReview, 
            rating: newRating,
            user_id: user.id  // Add this line
          }
        ]);

      if (error) throw error;

      setNewReview('');
      setNewRating(0);
      setShowReviewForm(false);
      fetchReviews();
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again later.');
    }
  };

  const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} focus:outline-none`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
        <button 
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out"
        >
          {showReviewForm ? 'Cancel' : 'Leave Review'}
        </button>
      </div>
      
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="mb-8">
          <textarea
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            required
          />
          <div className="flex items-center mt-4">
            <label className="mr-2 text-gray-700">Rating:</label>
            <StarRating rating={newRating} onRatingChange={setNewRating} />
            <button type="submit" className="ml-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out">
              Submit Review
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-50 rounded-lg p-4 shadow">
            <p className="text-gray-800 mb-2">{review.content}</p>
            <div className="flex justify-between items-center">
              <span className="text-yellow-500 font-bold">
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}