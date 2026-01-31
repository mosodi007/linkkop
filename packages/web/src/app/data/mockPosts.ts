import { User } from './mockUsers';

export interface Post {
  id: string;
  authorId: string;
  author: Pick<User, 'id' | 'name' | 'photo' | 'occupation' | 'city'>;
  content: string;
  image?: string;
  location: string;
  city: string;
  createdAt: string; // ISO date
  likes: number;
  comments: number;
  /** True if the current user has liked this post (set when feed is fetched with current user). */
  likedByMe?: boolean;
}

export const mockPosts: Post[] = [
  {
    id: 'p1',
    authorId: '1',
    author: {
      id: '1',
      name: 'Amina Okonkwo',
      photo: 'https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=400&h=400&fit=crop',
      occupation: 'Marketing Manager',
      city: 'Lagos',
    },
    content: 'Just wrapped an amazing networking event in Victoria Island. So many great connections made. If you\'re in Lagos and into tech & business, let\'s connect!',
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop',
    location: 'Victoria Island, Lagos',
    city: 'Lagos',
    createdAt: '2025-01-29T10:00:00Z',
    likes: 24,
    comments: 5,
  },
  {
    id: 'p2',
    authorId: '2',
    author: {
      id: '2',
      name: 'Chukwudi Eze',
      photo: 'https://images.unsplash.com/photo-1619452220963-4da4e145aba9?w=400&h=400&fit=crop',
      occupation: 'Software Engineer',
      city: 'Lagos',
    },
    content: 'Coffee and code at a new spot in Lekki. The vibe here is perfect for getting work done. Who else works remotely from Lagos?',
    location: 'Lekki Phase 1, Lagos',
    city: 'Lagos',
    createdAt: '2025-01-29T08:30:00Z',
    likes: 18,
    comments: 3,
  },
  {
    id: 'p3',
    authorId: '3',
    author: {
      id: '3',
      name: 'Funmi Adeyemi',
      photo: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=400&h=400&fit=crop',
      occupation: 'Fashion Designer',
      city: 'Lagos',
    },
    content: 'New collection drop happening this weekend at the pop-up in Ikeja. Would love to see some familiar faces!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    location: 'Ikeja, Lagos',
    city: 'Lagos',
    createdAt: '2025-01-28T16:00:00Z',
    likes: 42,
    comments: 12,
  },
  {
    id: 'p4',
    authorId: '5',
    author: {
      id: '5',
      name: 'Tunde Bakare',
      photo: 'https://images.unsplash.com/photo-1668752600261-e56e7f3780b6?w=400&h=400&fit=crop',
      occupation: 'Financial Analyst',
      city: 'Lagos',
    },
    content: 'Quick thought: the best networking happens when you focus on giving value first. Happy to share insights on finance and career growth with anyone in the Lagos community.',
    location: 'Lagos',
    city: 'Lagos',
    createdAt: '2025-01-28T12:00:00Z',
    likes: 31,
    comments: 8,
  },
  {
    id: 'p5',
    authorId: '8',
    author: {
      id: '8',
      name: 'Ngozi Eze',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      occupation: 'Content Creator',
      city: 'Lagos',
    },
    content: 'Sunset views from the mainland never get old. Grateful for this city and the creative community here.',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=500&fit=crop',
    location: 'Mainland, Lagos',
    city: 'Lagos',
    createdAt: '2025-01-28T18:00:00Z',
    likes: 56,
    comments: 7,
  },
  {
    id: 'p6',
    authorId: '4',
    author: {
      id: '4',
      name: 'Zainab Ibrahim',
      photo: 'https://images.unsplash.com/photo-1687422808311-a776f467a468?w=400&h=400&fit=crop',
      occupation: 'Business Consultant',
      city: 'Lagos',
    },
    content: 'Running a free workshop on business strategy next Saturday in Yaba. DM if you\'d like to join — limited seats.',
    location: 'Yaba, Lagos',
    city: 'Lagos',
    createdAt: '2025-01-27T14:00:00Z',
    likes: 39,
    comments: 15,
  },
  {
    id: 'p7',
    authorId: '9',
    author: {
      id: '9',
      name: 'Ibrahim Musa',
      photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      occupation: 'Product Manager',
      city: 'Lagos',
    },
    content: 'Product folks in Lagos — what\'s your biggest challenge right now? Building in public and would love to learn from you.',
    location: 'Lagos',
    city: 'Lagos',
    createdAt: '2025-01-27T09:00:00Z',
    likes: 22,
    comments: 11,
  },
  {
    id: 'p8',
    authorId: '10',
    author: {
      id: '10',
      name: 'Adaeze Okoli',
      photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop',
      occupation: 'Social Media Manager',
      city: 'Lagos',
    },
    content: 'Best brunch spots in Lagos? Drop your recommendations below — planning a casual meet-up for creatives and marketers.',
    location: 'Lagos',
    city: 'Lagos',
    createdAt: '2025-01-26T11:00:00Z',
    likes: 47,
    comments: 28,
  },
];
