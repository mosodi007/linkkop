import { Link } from 'react-router-dom';
import { User, getMessengerIconUrl } from '@/app/data/mockUsers';
import { Linkedin, Twitter, Instagram, Facebook, Phone } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface UserCardProps {
  user: User;
  onRequestContact: (userId: string) => void;
  profilePageUrl?: string;
}

const SOCIAL_ICONS: Record<string, { Icon: typeof Linkedin; label: string }> = {
  linkedin: { Icon: Linkedin, label: 'LinkedIn' },
  twitter: { Icon: Twitter, label: 'X (Twitter)' },
  instagram: { Icon: Instagram, label: 'Instagram' },
  facebook: { Icon: Facebook, label: 'Facebook' },
};

export function UserCard({ user, onRequestContact, profilePageUrl }: UserCardProps) {
  const photoBlock = (
    <div className="relative h-48">
      <img
        src={user.photo}
        alt={user.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <h2 className="text-white font-semibold text-lg">
          {user.name}, {user.age}
        </h2>
        <p className="text-white/90 text-sm">{user.occupation}</p>
        <p className="text-white/80 text-xs mt-0.5">
          {user.distance} km away · {user.city}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
      {profilePageUrl ? (
        <Link to={profilePageUrl} className="block">
          {photoBlock}
        </Link>
      ) : (
        photoBlock
      )}

      <div className="p-4 space-y-4">
        {/* Bio */}
        {user.bio && (
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              BIO
            </p>
            <p className="text-sm text-neutral-700 leading-relaxed">{user.bio}</p>
          </div>
        )}
        <div>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(user.socialNetworks) as [string, string | undefined][]).map(
              ([key, value]) => {
                const social = SOCIAL_ICONS[key];
                if (!value || !social) return null;
                const Icon = social.Icon;
                return (
                  <a
                    key={key}
                    href={value.startsWith('http') ? value : `https://${key}.com/${value.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              }
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
            Contact Number
          </p>
          <p className="text-sm font-mono text-neutral-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            {user.phone}
          </p>
        </div>

        {/* Social networks */}
        

        {/* Messenger icons – available on */}
        {user.messenger && user.messenger.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {user.messenger.map((m) => {
                const iconUrl = getMessengerIconUrl(m);
                if (!iconUrl) return null;
                return (
                  <img
                    key={m}
                    src={iconUrl}
                    alt={m}
                    className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                    title={m.charAt(0).toUpperCase() + m.slice(1)}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {profilePageUrl && (
            <Link to={profilePageUrl}>
            </Link>
          )}
          <Button
            onClick={() => onRequestContact(user.id)}
            className="w-full rounded-xl bg-[#41C28A] text-[#fff] hover:bg-[#38ad7a] hover:text-[#000000]"
          >
            Request Contact
          </Button>
        </div>
      </div>
    </div>
  );
}
