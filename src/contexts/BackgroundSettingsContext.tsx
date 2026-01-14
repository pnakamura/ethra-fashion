import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type BackgroundVariant = 'abstract' | 'portrait' | 'custom' | 'none';
export type ThemeMode = 'dark' | 'light';

interface ModeBackgroundSettings {
  variant: BackgroundVariant;
  opacity: number; // 0.15 to 1.0
  customImageUrl?: string;
}

interface BackgroundSettings {
  dark: ModeBackgroundSettings;
  light: ModeBackgroundSettings;
}

interface BackgroundSettingsContextType {
  settings: BackgroundSettings;
  setVariant: (mode: ThemeMode, variant: BackgroundVariant) => void;
  setOpacity: (mode: ThemeMode, opacity: number) => void;
  setCustomImage: (mode: ThemeMode, url: string | undefined) => void;
  uploadCustomBackground: (mode: ThemeMode, file: File) => Promise<string | null>;
  deleteCustomBackground: (mode: ThemeMode) => Promise<void>;
  isLoading: boolean;
  isUploading: boolean;
}

const defaultSettings: BackgroundSettings = {
  dark: {
    variant: 'abstract',
    opacity: 0.30,
    customImageUrl: undefined,
  },
  light: {
    variant: 'none',
    opacity: 0.15,
    customImageUrl: undefined,
  },
};

const BackgroundSettingsContext = createContext<BackgroundSettingsContextType | undefined>(undefined);

export function BackgroundSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load settings from localStorage (persists without needing auth)
  useEffect(() => {
    const stored = localStorage.getItem('ethra-bg-settings-v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          dark: {
            variant: parsed.dark?.variant || 'abstract',
            opacity: parsed.dark?.opacity ?? 0.30,
            customImageUrl: parsed.dark?.customImageUrl || undefined,
          },
          light: {
            variant: parsed.light?.variant || 'none',
            opacity: parsed.light?.opacity ?? 0.15,
            customImageUrl: parsed.light?.customImageUrl || undefined,
          },
        });
      } catch {
        // Invalid JSON, use defaults
      }
    } else {
      // Migrate from old settings format
      const oldStored = localStorage.getItem('ethra-bg-settings');
      if (oldStored) {
        try {
          const parsed = JSON.parse(oldStored);
          setSettings({
            dark: {
              variant: parsed.variant || 'abstract',
              opacity: parsed.opacity ?? 0.30,
              customImageUrl: parsed.customImageUrl || undefined,
            },
            light: {
              variant: 'none',
              opacity: 0.15,
              customImageUrl: undefined,
            },
          });
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('ethra-bg-settings-v2', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  const setVariant = (mode: ThemeMode, variant: BackgroundVariant) => {
    setSettings(prev => ({
      ...prev,
      [mode]: { ...prev[mode], variant },
    }));
  };

  const setOpacity = (mode: ThemeMode, opacity: number) => {
    // Clamp between 0.15 and 1.0
    const clamped = Math.min(1.0, Math.max(0.15, opacity));
    setSettings(prev => ({
      ...prev,
      [mode]: { ...prev[mode], opacity: clamped },
    }));
  };

  const setCustomImage = (mode: ThemeMode, url: string | undefined) => {
    setSettings(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        customImageUrl: url,
        variant: url ? 'custom' : prev[mode].variant === 'custom' ? 'abstract' : prev[mode].variant,
      },
    }));
  };

  const uploadCustomBackground = async (mode: ThemeMode, file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${mode}/custom-bg-${Date.now()}.${fileExt}`;
      
      // Delete existing custom background for this mode first
      const { data: existingFiles } = await supabase.storage
        .from('custom-backgrounds')
        .list(`${user.id}/${mode}`);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${mode}/${f.name}`);
        await supabase.storage
          .from('custom-backgrounds')
          .remove(filesToDelete);
      }
      
      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('custom-backgrounds')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('custom-backgrounds')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      // Update settings for this mode
      setSettings(prev => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          customImageUrl: publicUrl,
          variant: 'custom',
        },
      }));
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading background:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCustomBackground = async (mode: ThemeMode) => {
    if (!user) return;
    
    try {
      const { data: existingFiles } = await supabase.storage
        .from('custom-backgrounds')
        .list(`${user.id}/${mode}`);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${mode}/${f.name}`);
        await supabase.storage
          .from('custom-backgrounds')
          .remove(filesToDelete);
      }
      
      setSettings(prev => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          customImageUrl: undefined,
          variant: 'abstract',
        },
      }));
    } catch (error) {
      console.error('Error deleting background:', error);
    }
  };

  return (
    <BackgroundSettingsContext.Provider value={{ 
      settings, 
      setVariant, 
      setOpacity, 
      setCustomImage,
      uploadCustomBackground,
      deleteCustomBackground,
      isLoading,
      isUploading,
    }}>
      {children}
    </BackgroundSettingsContext.Provider>
  );
}

export function useBackgroundSettings() {
  const context = useContext(BackgroundSettingsContext);
  if (!context) {
    throw new Error('useBackgroundSettings must be used within BackgroundSettingsProvider');
  }
  return context;
}
