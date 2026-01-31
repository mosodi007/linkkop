import { useState } from 'react';
import { User } from '@/app/data/mockUsers';
import { UserCard } from '@/app/components/UserCard';
import { useDiscoverProfiles } from '@/app/lib/discover';
import { Search } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { toast } from 'sonner';

type CategoryKey = 'all' | 'nearby' | 'interest' | 'profession' | 'new';

const CATEGORIES: { key: CategoryKey; label: string; description: string }[] = [
  { key: 'all', label: 'Everyone', description: 'All people nearby' },
  { key: 'nearby', label: 'Less than 10 km', description: 'People close to you' },
  { key: 'interest', label: 'Based on your interest', description: 'Shared interests' },
  { key: 'profession', label: 'By profession', description: 'Similar work fields' },
  { key: 'new', label: 'Recently joined', description: 'New to the network' },
];

// Mock "your" interests for "Based on your interest"
const YOUR_INTERESTS = ['Tech', 'Networking', 'Business'];

function getUsersByCategory(users: User[], category: CategoryKey): User[] {
  switch (category) {
    case 'nearby':
      return users.filter((u) => u.distance < 10).sort((a, b) => a.distance - b.distance);
    case 'interest':
      return users.filter((u) =>
        u.interests.some((i) => YOUR_INTERESTS.some((y) => y.toLowerCase() === i.toLowerCase()))
      );
    case 'profession':
      return [...users].sort((a, b) => a.occupation.localeCompare(b.occupation));
    case 'new':
      return [...users].reverse();
    default:
      return users;
  }
}

export function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const { users, loading } = useDiscoverProfiles();

  const handleRequestContact = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    toast.success('Connection request sent', {
      description: `You requested to connect with ${user?.name}`,
    });
  };

  const byCategory = getUsersByCategory(users, activeCategory);
  const filteredUsers = searchQuery.trim()
    ? byCategory.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : byCategory;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Discover</h1>
        <p className="text-sm text-neutral-500 mb-6">Find people to connect with</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by name, job, or interest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-neutral-200 rounded-xl h-11"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-2 mb-4">
          {CATEGORIES.find((c) => c.key === activeCategory)?.description}
        </p>

        {/* Results count */}
        <p className="text-sm text-neutral-500 mb-4">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16 text-neutral-500 text-sm">Loading…</div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onRequestContact={handleRequestContact}
                profilePageUrl={`/user/${user.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-500 text-sm">
            No one matches right now. Try another category or search.
          </div>
        )}
      </div>
    </div>
  );
}
