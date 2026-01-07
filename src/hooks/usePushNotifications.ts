import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    // Check current subscription status
    checkSubscription();
  }, [user]);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Check if service worker is registered with a timeout
      const swRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
      
      if (!swRegistration) {
        // No service worker registered yet
        setIsSubscribed(false);
        setIsLoading(false);
        return;
      }

      const subscription = await swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        // Check if this subscription exists in our database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();

        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !VAPID_PUBLIC_KEY) {
      toast({
        title: 'Push notifications not available',
        description: 'Please try again later.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission denied',
          description: 'You need to allow notifications to receive updates.',
          variant: 'destructive'
        });
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      console.log('Push subscription:', subscription);

      // Extract keys
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      // Convert to base64
      const p256dhArray = Array.from(new Uint8Array(p256dhKey));
      const authArray = Array.from(new Uint8Array(authKey));
      const p256dhBase64 = btoa(String.fromCharCode(...p256dhArray));
      const authBase64 = btoa(String.fromCharCode(...authArray));

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: p256dhBase64,
          auth: authBase64
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast({
        title: 'Notifications enabled',
        description: "You'll receive updates when expenses or settlements are added."
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Failed to enable notifications',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast({
        title: 'Notifications disabled',
        description: "You won't receive push notifications anymore."
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Failed to disable notifications',
        variant: 'destructive'
      });
      return false;
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  };
}

// Utility function to send push notification via edge function
export async function sendPushNotification(data: {
  groupId: string;
  type: 'expense' | 'settlement';
  title: string;
  body: string;
  actorUserId: string;
}) {
  try {
    const response = await supabase.functions.invoke('send-push-notification', {
      body: data
    });

    if (response.error) {
      console.error('Push notification error:', response.error);
    } else {
      console.log('Push notification sent:', response.data);
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}
