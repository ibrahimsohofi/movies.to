import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Your connection has been restored.', {
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000,
      });
      setShowOfflineToast(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
      toast.error('No internet connection. Please check your network.', {
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity,
        id: 'offline-toast',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything - we're using toasts for notifications
  return null;
}
