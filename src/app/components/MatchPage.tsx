import { useState } from 'react';
import { mockUsers, User } from '@/app/data/mockUsers';
import { UserCard } from '@/app/components/UserCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

export function MatchPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredUsers] = useState<User[]>(mockUsers);

  const currentUser = filteredUsers[currentIndex];

  const handleRequestContact = (userId: string) => {
    toast.success('Contact request sent!', {
      description: `You've requested to connect with ${currentUser.name}`,
    });
  };

  const handleNext = () => {
    if (currentIndex < filteredUsers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-lime-400 mb-2">Find Your Match</h1>
          <p className="text-lime-300 text-lg">
            We found <span className="font-bold text-lime-400">{filteredUsers.length}</span> people in Lagos who match your interest
          </p>
        </div>

        {/* Card Container */}
        {currentUser && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Previous Button */}
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500 rounded-full w-14 h-14 p-0 disabled:opacity-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* User Card */}
            <UserCard user={currentUser} onRequestContact={handleRequestContact} />

            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={currentIndex === filteredUsers.length - 1}
              className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500 rounded-full w-14 h-14 p-0 disabled:opacity-30"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Counter and Skip */}
        <div className="text-center space-y-4">
          <p className="text-gray-400">
            {currentIndex + 1} of {filteredUsers.length}
          </p>
          <Button
            onClick={handleSkip}
            disabled={currentIndex === filteredUsers.length - 1}
            className="bg-black hover:bg-gray-900 text-lime-400 border border-lime-500 px-8 py-3"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
