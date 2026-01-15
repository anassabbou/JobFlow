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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    fetchOffers();
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
    </div>
  );
};

export default EmploiPublicOffers;
