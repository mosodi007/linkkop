export interface OccupationRow {
  id: string;
  name: string;
}

export interface ProfileRow {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  interests: string[];
  phone: string | null;
  messenger: string[] | null;
  social_networks: Record<string, string>;
  avatar_url: string | null;
  bio: string | null;
  location_enabled: boolean;
  lat: number | null;
  lng: number | null;
  city: string | null;
  country: string | null;
  gender: string | null;
  occupation_id: string | null;
  /** Joined from occupations when selected with select('*, occupations(name)') */
  occupations?: { name: string } | null;
  created_at: string;
  updated_at: string;
  post_visibility?: 'everyone' | 'contacts' | 'only_me';
  profile_visibility?: 'everyone' | 'contacts' | 'only_me';
  show_me_gender?: 'females' | 'males' | 'both';
  show_me_scope?: 'worldwide' | 'my_location';
  age_min?: number;
  age_max?: number;
  show_me_interests?: string[];
}

export interface DiscoverProfileRow {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  interests: string[];
  phone: string | null;
  messenger: string[] | null;
  social_networks: Record<string, string>;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  occupation: string | null;
  distance_km: number | null;
  created_at: string;
}

export interface ContactRow {
  id: string;
  user_id: string;
  contact_id: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  location: string | null;
  city: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  hidden_by_author?: boolean;
}

export interface DiscoverPostRow {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  location: string | null;
  city: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}
