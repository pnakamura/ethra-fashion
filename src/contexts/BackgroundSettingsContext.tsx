import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type BackgroundVariant = 'abstract' | 'portrait' | 'custom' | 'none';

interface BackgroundSettings {
  variant: BackgroundVariant;
  opacity: number; // 0.30 to 1.0
  customImageUrl?: string;
}

interface BackgroundSettingsContextType {
  settings: BackgroundSettings;
  setVariant: (variant: BackgroundVariant) => void;
  setOpacity: (opacity: number) => void;
  setCustomImage: (url: string | undefined) => void;
  uploadCustomBackground: (file: File) => Promise<string | null>;
  deleteCustomBackground: () => Promise<void>;
  isLoading: boolean;
  isUploading: boolean;
}

const defaultSettings: BackgroundSettings = {
  variant: 'abstract',
  opacity: 0.30,
  customImageUrl: undefined,
};

const BackgroundSettingsContext = createContext<BackgroundSettingsContextType | undefined>(undefined);

export function BackgroundSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BackgroundSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load settings from localStorage (persists without needing auth)
  useEffect(() => {
    const stored = localStorage.getItem('ethra-bg-settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({
          variant: parsed.variant || 'abstract',
          opacity: parsed.opacity ?? 0.30,
          customImageUrl: parsed.customImageUrl || undefined,
        });
      } catch {
        // Invalid JSON, use defaults
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('ethra-bg-settings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  const setVariant = (variant: BackgroundVariant) => {
    setSettings(prev => ({ ...prev, variant }));
  };

  const setOpacity = (opacity: number) => {
    // Clamp between 0.30 and 1.0
    const clamped = Math.min(1.0, Math.max(0.30, opacity));
    setSettings(prev => ({ ...prev, opacity: clamped }));
  };

  const setCustomImage = (url: string | undefined) => {
    setSettings(prev => ({ 
      ...prev, 
      customImageUrl: url,
      variant: url ? 'custom' : prev.variant === 'custom' ? 'abstract' : prev.variant
    }));
  };

  const uploadCustomBackground = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/custom-bg-${Date.now()}.${fileExt}`;
      
      // Delete existing custom background first
      const { data: existingFiles } = await supabase.storage
        .from('custom-backgrounds')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
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
      
      // Update settings
      setSettings(prev => ({
        ...prev,
        customImageUrl: publicUrl,
        variant: 'custom',
      }));
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading background:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteCustomBackground = async () => {
    if (!user) return;
    
    try {
      const { data: existingFiles } = await supabase.storage
        .from('custom-backgrounds')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('custom-backgrounds')
          .remove(filesToDelete);
      }
      
      setSettings(prev => ({
        ...prev,
        customImageUrl: undefined,
        variant: 'abstract',
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
