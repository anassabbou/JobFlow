import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { offlineService } from '../services/offlineService';
import { enhancedJobApplicationService } from '../services/enhancedJobApplicationService';

interface NetworkStatusProps {
  onSync?: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onSync }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queuedActions, setQueuedActions] = useState(0);

  useEffect(() => {
    const cleanup = offlineService.setupNetworkListeners(
      () => {
        setIsOnline(true);
        handleSync();
      },
      () => {
        setIsOnline(false);
      }
    );

    // Check queued actions on mount
    updateQueuedActions();

    return cleanup;
  }, []);

  const updateQueuedActions = () => {
    const queue = offlineService.getOfflineQueue();
    setQueuedActions(queue.length);
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await enhancedJobApplicationService.syncOfflineActions();
      updateQueuedActions();
      onSync?.();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && queuedActions === 0) {
    return null; // Don't show anything when online and no pending actions
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${
      isOnline ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'
    } border rounded-lg p-3 shadow-lg max-w-sm`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isOnline ? 'Connected' : 'Offline'}
          </p>
          {queuedActions > 0 && (
            <p className="text-xs">
              {queuedActions} action{queuedActions > 1 ? 's' : ''} pending sync
            </p>
          )}
        </div>

        {isOnline && queuedActions > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Sync pending changes"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;