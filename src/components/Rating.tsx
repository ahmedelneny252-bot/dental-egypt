import { Star } from "lucide-react";

const Rating = ({ rating, reviewCount }: { rating: number; reviewCount: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {/* Full Stars */}
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star
          key={index}
          className="w-4 h-4 text-amber-400"
        />
      ))}
      
      {/* Half Star */}
      {hasHalfStar && (
        <Star
          className="w-4 h-4 text-amber-400/50"
        />
      )}
      
      {/* Empty Stars */}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <Star
          key={index}
          className="w-4 h-4 text-amber-200"
        />
      ))}
      
      {/* Rating Text */}
      <span className="text-sm font-medium text-slate-700 ml-2">
        {rating.toFixed(1)} ({reviewCount})
      </span>
    </div>
  );
};

export default Rating;