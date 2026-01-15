import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, PlusCircle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EmploiPublicOffer } from '../types/EmploiPublicOffer';

interface EmploiPublicOffersProps {
  onImport: (offer: EmploiPublicOffer) => void;
}

const EmploiPublicOffers: React.FC<EmploiPublicOffersProps> = ({ onImport }) => {
  const [offers, setOffers] = useState<EmploiPublicOffer[]>([]);
  const [allOffers, setAllOffers] = useState<EmploiPublicOffer[]>([]);
  const [expirationFilter, setExpirationFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allOffersError, setAllOffersError] = useState<string | null>(null);

  const gradeOptions = [
    'Administrateur deuxième grade',
    'ADJOINT TECHNIQUE 2EME GRADE',
    'Administrateur troisième grade',
    'Architecte premier grade',
    "Ingénieur D'Etat premier grade",
    'Maitre de conférences grade A',
    'Technicien de 3ème Grade',
    'Technicien de 4ème Grade',
  ];

  const parseFrenchDate = (value: string) => {
    const normalized = value
      .toLowerCase()
      .replace('er', '')
      .replace('1er', '1')
      .trim();
    const months: Record<string, number> = {
      janvier: 0,
      fevrier: 1,
      février: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      aout: 7,
      août: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      decembre: 11,
      décembre: 11,
    };

    const parts = normalized.split(/\s+/);
    if (parts.length < 3) return null;
    const day = Number(parts[0]);
    const month = months[parts[1]];
    const year = Number(parts[2]);
    if (!day || month === undefined || !year) return null;
    return new Date(year, month, day);
  };

  const isExpired = (deadline?: string) => {
    if (!deadline) return false;
    const date = parseFrenchDate(deadline);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const filteredAllOffers = allOffers
    .filter((offer) => {
      if (expirationFilter === 'active') {
        return !isExpired(offer.deadline);
      }
      if (expirationFilter === 'expired') {
        return isExpired(offer.deadline);
      }
      return true;
    })
    .filter((offer) => {
      if (gradeFilter === 'all') return true;
      return offer.title?.toLowerCase().includes(gradeFilter.toLowerCase());
    });

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'emploiPublicOffers'));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as EmploiPublicOffer[];
        const sorted = data.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setOffers(sorted);
      } catch (err) {
        console.error('Failed to load emploi public offers:', err);
        setError('Failed to load offers. Check Firestore permissions and data.');
      } finally {
        setLoading(false);
      }
    };

    const fetchAllOffers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'emploiPublicAllOffers'));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as EmploiPublicOffer[];
        const sorted = data.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
        setAllOffers(sorted);
      } catch (err) {
        console.error('Failed to load emploi public all offers:', err);
        setAllOffersError('Failed to load all offers. Check Firestore permissions and data.');
      }
    };

    fetchOffers();
    fetchAllOffers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading offers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Emploi Public</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Latest offers scraped from emploi-public.ma (Dernière chance pour postuler).
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          No offers available yet. Check back after the next daily scrape.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              {offer.image_url && (
                <img
                  src={offer.image_url}
                  alt={offer.title}
                  className="mb-3 h-40 w-full rounded-md object-cover"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{offer.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{offer.organization}</p>
              {offer.urgency_message && (
                <p className="mt-2 text-xs font-medium text-red-600">{offer.urgency_message}</p>
              )}
              {offer.deadline && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Deadline: {offer.deadline}</p>
              )}
              {offer.posts_count && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{offer.posts_count}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => onImport(offer)}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add to JobFlow
                </button>
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Offers</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Full list from emploi-public.ma.
        </p>

        {allOffersError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {allOffersError}
          </div>
        )}

        {!allOffersError && allOffers.length === 0 && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            No offers available yet. Check back after the next daily scrape.
          </div>
        )}

        {!allOffersError && allOffers.length > 0 && (
          <>
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Statut d&apos;expiration
                </label>
                <select
                  value={expirationFilter}
                  onChange={(e) => setExpirationFilter(e.target.value as 'all' | 'active' | 'expired')}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Tous</option>
                  <option value="active">Active</option>
                  <option value="expired">EXPIRÉE</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Grade
                </label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Tous les grades</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredAllOffers.length === 0 ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                No offers match these filters.
              </div>
            ) : (
              <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAllOffers.map((offer) => (
                  <div key={offer.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{offer.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{offer.organization}</p>
                    {offer.deadline && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Deadline: {offer.deadline}</p>
                    )}
                    {offer.posts_count && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{offer.posts_count}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => onImport(offer)}
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add to JobFlow
                      </button>
                      <a
                        href={offer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EmploiPublicOffers;
