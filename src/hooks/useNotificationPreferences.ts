import { useState, useEffect, useCallback } from 'react';

export interface NotificationPreferences {
  soundEnabled: boolean;
  types: {
    expense: boolean;
    settlement: boolean;
    member: boolean;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  types: {
    expense: true,
    settlement: true,
    member: true,
  },
};

const STORAGE_KEY = 'notification-preferences';

export function useNotificationPreferences() {
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  const setPreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPreferences };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
      return updated;
    });
  }, []);

  const setTypeEnabled = useCallback((type: keyof NotificationPreferences['types'], enabled: boolean) => {
    setPreferencesState((prev) => {
      const updated = {
        ...prev,
        types: { ...prev.types, [type]: enabled },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
      return updated;
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setPreferences({ soundEnabled: enabled });
  }, [setPreferences]);

  const shouldPlaySound = useCallback(() => {
    return preferences.soundEnabled;
  }, [preferences.soundEnabled]);

  const isTypeEnabled = useCallback((notificationType: string): boolean => {
    // Map notification types to preference keys
    if (notificationType.includes('expense')) return preferences.types.expense;
    if (notificationType.includes('settlement')) return preferences.types.settlement;
    if (notificationType.includes('member') || notificationType.includes('join')) return preferences.types.member;
    return true; // Enable by default for unknown types
  }, [preferences.types]);

  return {
    preferences,
    setPreferences,
    setTypeEnabled,
    setSoundEnabled,
    shouldPlaySound,
    isTypeEnabled,
  };
}
