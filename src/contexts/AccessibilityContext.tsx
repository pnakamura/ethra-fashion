import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type FontSize = 'normal' | 'large' | 'xlarge';
export type ThemePreference = 'system' | 'light' | 'dark';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const FONT_SIZE_KEY = 'ethra-font-size';
const THEME_KEY = 'ethra-theme';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      // First check localStorage for immediate feedback
      const savedFontSize = localStorage.getItem(FONT_SIZE_KEY) as FontSize;
      const savedTheme = localStorage.getItem(THEME_KEY) as ThemePreference;

      if (savedFontSize) {
        setFontSizeState(savedFontSize);
        applyFontSize(savedFontSize);
      }

      if (savedTheme) {
        setThemePreferenceState(savedTheme);
        setTheme(savedTheme);
      }

      // Then sync with database if user is logged in
      if (user) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('theme_preference, font_size')
            .eq('user_id', user.id)
            .single();

          if (data) {
            if (data.font_size) {
              const dbFontSize = data.font_size as FontSize;
              setFontSizeState(dbFontSize);
              applyFontSize(dbFontSize);
              localStorage.setItem(FONT_SIZE_KEY, dbFontSize);
            }

            if (data.theme_preference) {
              const dbTheme = data.theme_preference as ThemePreference;
              setThemePreferenceState(dbTheme);
              setTheme(dbTheme);
              localStorage.setItem(THEME_KEY, dbTheme);
            }
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }

      setIsLoading(false);
    };

    loadPreferences();
  }, [user, setTheme]);

  const applyFontSize = (size: FontSize) => {
    document.documentElement.classList.remove('font-normal', 'font-large', 'font-xlarge');
    document.documentElement.classList.add(`font-${size}`);
  };

  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    applyFontSize(size);
    localStorage.setItem(FONT_SIZE_KEY, size);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ font_size: size })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving font size:', error);
      }
    }
  };

  const setThemePreference = async (theme: ThemePreference) => {
    setThemePreferenceState(theme);
    setTheme(theme);
    localStorage.setItem(THEME_KEY, theme);

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: theme })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        themePreference,
        setThemePreference,
        isLoading,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
