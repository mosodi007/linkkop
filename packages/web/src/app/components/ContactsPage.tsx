import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyContacts, type ContactProfile } from '@/app/lib/contacts';

export function ContactsPage() {
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyContacts().then((list) => {
      if (!cancelled) {
        setContacts(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-1">Contacts</h1>
        <p className="text-sm text-neutral-500 mb-6">People you've connected with</p>

        {loading ? (
          <p className="text-neutral-500 text-sm py-8">Loading contacts…</p>
        ) : contacts.length > 0 ? (
          <div className="space-y-1 bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/user/${contact.id}`}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
              >
                <img
                  src={contact.photo}
                  alt={contact.name}
                  className="w-12 h-12 rounded-full object-cover bg-neutral-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900">{contact.name}</p>
                  <p className="text-sm text-neutral-500 truncate">{contact.city || '—'}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-neutral-500 text-sm">
            No contacts yet. Discover people and accept connection requests to add contacts.
          </p>
        )}
      </div>
    </div>
  );
}
