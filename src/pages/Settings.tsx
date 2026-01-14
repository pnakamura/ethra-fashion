import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, Moon, Monitor, Type, Bell, MapPin, Clock, 
  LogOut, CreditCard, User, ChevronRight, Sparkles,
  Calendar, CloudSun, Image, EyeOff, Palette, Upload, Trash2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAccessibility, type FontSize, type ThemePreference } from '@/contexts/AccessibilityContext';
import { useBackgroundSettings, type BackgroundVariant, type ThemeMode } from '@/contexts/BackgroundSettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface NotificationPrefs {
  look_of_day_enabled: boolean;
  look_of_day_time: string;
  weather_alerts_enabled: boolean;
  event_reminders_enabled: boolean;
  event_reminder_hours: number;
  city: string;
}

const themeOptions: { value: ThemePreference; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
];

const fontSizeOptions: { value: FontSize; label: string; sample: string }[] = [
  { value: 'normal', label: 'Normal', sample: 'Aa' },
  { value: 'large', label: 'Grande', sample: 'Aa' },
  { value: 'xlarge', label: 'Extra Grande', sample: 'Aa' },
];

const backgroundOptions: { value: BackgroundVariant; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'abstract', label: 'Abstrato', icon: Palette },
  { value: 'portrait', label: 'Retrato', icon: Image },
  { value: 'custom', label: 'Personalizado', icon: Upload },
  { value: 'none', label: 'Desativado', icon: EyeOff },
];

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const darkFileInputRef = useRef<HTMLInputElement>(null);
  const lightFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ThemeMode>('dark');
  const { fontSize, setFontSize, themePreference, setThemePreference } = useAccessibility();
  const { 
    settings: bgSettings, 
    setVariant, 
    setOpacity, 
    uploadCustomBackground, 
    deleteCustomBackground,
    isUploading 
  } = useBackgroundSettings();

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    look_of_day_enabled: true,
    look_of_day_time: '08:00',
    weather_alerts_enabled: true,
    event_reminders_enabled: true,
    event_reminder_hours: 2,
    city: '',
  });

  // Fetch notification preferences
  const { data: savedPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (savedPrefs) {
      setNotifPrefs({
        look_of_day_enabled: savedPrefs.look_of_day_enabled ?? true,
        look_of_day_time: savedPrefs.look_of_day_time ?? '08:00',
        weather_alerts_enabled: savedPrefs.weather_alerts_enabled ?? true,
        event_reminders_enabled: savedPrefs.event_reminders_enabled ?? true,
        event_reminder_hours: savedPrefs.event_reminder_hours ?? 2,
        city: savedPrefs.city ?? '',
      });
    }
  }, [savedPrefs]);

  // Save notification preferences
  const saveNotifMutation = useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferências salvas!');
    },
    onError: () => {
      toast.error('Erro ao salvar preferências');
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSaveNotifications = () => {
    saveNotifMutation.mutate(notifPrefs);
  };

  return (
    <>
      <Header title="Configurações" />
      <PageContainer className="px-4 py-6">
        <div className="max-w-lg mx-auto md:max-w-2xl lg:max-w-3xl space-y-6">
          {/* Appearance Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" />
              Aparência
            </h2>

            <div className="bg-card rounded-2xl border border-border p-4 space-y-5">
              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Tema</label>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = themePreference === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setThemePreference(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:neon-border dark:bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-primary dark:neon-text-gold' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {option.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Font Size Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Tamanho do Texto
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {fontSizeOptions.map((option) => {
                    const isSelected = fontSize === option.value;
                    const sampleSizes: Record<FontSize, string> = {
                      normal: 'text-base',
                      large: 'text-lg',
                      xlarge: 'text-xl',
                    };
                    return (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFontSize(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 dark:neon-border dark:bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <span className={`font-display font-semibold ${sampleSizes[option.value]} ${isSelected ? 'text-primary dark:neon-text-gold' : 'text-muted-foreground'}`}>
                          {option.sample}
                        </span>
                        <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {option.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Background Selection with Tabs for Dark/Light Mode */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Fundo Artístico
                </label>
                
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ThemeMode)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="dark" className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Modo Escuro
                    </TabsTrigger>
                    <TabsTrigger value="light" className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Modo Claro
                    </TabsTrigger>
                  </TabsList>
                  
                  {(['dark', 'light'] as ThemeMode[]).map((mode) => {
                    const modeSettings = bgSettings[mode];
                    const fileInputRef = mode === 'dark' ? darkFileInputRef : lightFileInputRef;
                    
                    return (
                      <TabsContent key={mode} value={mode} className="space-y-4 mt-0">
                        {/* Variant Selection */}
                        <div className="grid grid-cols-4 gap-2">
                          {backgroundOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = modeSettings.variant === option.value;
                            const isCustom = option.value === 'custom';
                            const hasCustomImage = !!modeSettings.customImageUrl;
                            
                            return (
                              <motion.button
                                key={option.value}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (isCustom && !hasCustomImage) {
                                    fileInputRef.current?.click();
                                  } else {
                                    setVariant(mode, option.value);
                                  }
                                }}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 dark:neon-border dark:bg-primary/10'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                <Icon className={`w-5 h-5 ${isSelected ? 'text-primary dark:neon-text-gold' : 'text-muted-foreground'}`} />
                                <span className={`text-xs font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {option.label}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                        
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Imagem muito grande. Máximo 5MB.');
                                return;
                              }
                              const result = await uploadCustomBackground(mode, file);
                              if (result) {
                                toast.success('Fundo personalizado salvo!');
                              } else {
                                toast.error('Erro ao enviar imagem');
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                        
                        {/* Custom background preview & actions */}
                        {modeSettings.variant === 'custom' && modeSettings.customImageUrl && (
                          <div className="space-y-3">
                            <div className="relative rounded-xl overflow-hidden aspect-video border border-border">
                              <img 
                                src={modeSettings.customImageUrl} 
                                alt="Fundo personalizado" 
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                  className="flex-1 text-xs bg-background/80 backdrop-blur-sm"
                                >
                                  {isUploading ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3 mr-1" />
                                  )}
                                  Trocar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    await deleteCustomBackground(mode);
                                    toast.success('Fundo personalizado removido');
                                  }}
                                  className="text-xs bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              Sua imagem personalizada de fundo ({mode === 'dark' ? 'modo escuro' : 'modo claro'})
                            </p>
                          </div>
                        )}
                        
                        {/* Upload prompt when custom is selected but no image */}
                        {modeSettings.variant === 'custom' && !modeSettings.customImageUrl && (
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors text-center"
                          >
                            {isUploading ? (
                              <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                            ) : (
                              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                            )}
                            <p className="text-sm font-medium">Clique para enviar imagem</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
                          </div>
                        )}
                        
                        {/* Opacity Slider */}
                        {modeSettings.variant !== 'none' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Intensidade</span>
                              <span className="text-sm font-medium text-primary">{Math.round(modeSettings.opacity * 100)}%</span>
                            </div>
                            <Slider
                              value={[modeSettings.opacity * 100]}
                              onValueChange={(value) => setOpacity(mode, value[0] / 100)}
                              min={15}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Ajuste a visibilidade do fundo artístico (15% - 100%)
                            </p>
                          </div>
                        )}
                        
                        {/* Mode-specific tips */}
                        <p className="text-xs text-muted-foreground/70 italic">
                          {mode === 'dark' 
                            ? 'O fundo artístico no modo escuro cria uma atmosfera sofisticada e imersiva.'
                            : 'No modo claro, recomendamos usar opacidade mais baixa para manter a legibilidade.'
                          }
                        </p>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          </motion.section>

          {/* Notifications Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </h2>

            <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
              {/* Look of the Day */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Look do Dia</p>
                    <p className="text-xs text-muted-foreground">Sugestão diária de look</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={notifPrefs.look_of_day_time}
                    onChange={(e) => setNotifPrefs(p => ({ ...p, look_of_day_time: e.target.value }))}
                    className="w-24 text-xs rounded-lg"
                    disabled={!notifPrefs.look_of_day_enabled}
                  />
                  <Switch
                    checked={notifPrefs.look_of_day_enabled}
                    onCheckedChange={(checked) => setNotifPrefs(p => ({ ...p, look_of_day_enabled: checked }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Weather Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CloudSun className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Alertas de Clima</p>
                    <p className="text-xs text-muted-foreground">Mudanças climáticas importantes</p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs.weather_alerts_enabled}
                  onCheckedChange={(checked) => setNotifPrefs(p => ({ ...p, weather_alerts_enabled: checked }))}
                />
              </div>

              <Separator />

              {/* Event Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Lembretes de Eventos</p>
                    <p className="text-xs text-muted-foreground">Alertas para compromissos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={notifPrefs.event_reminder_hours}
                    onChange={(e) => setNotifPrefs(p => ({ ...p, event_reminder_hours: Number(e.target.value) }))}
                    className="text-xs rounded-lg border border-input bg-background px-2 py-1"
                    disabled={!notifPrefs.event_reminders_enabled}
                  >
                    <option value={1}>1h antes</option>
                    <option value={2}>2h antes</option>
                    <option value={4}>4h antes</option>
                    <option value={24}>1 dia antes</option>
                  </select>
                  <Switch
                    checked={notifPrefs.event_reminders_enabled}
                    onCheckedChange={(checked) => setNotifPrefs(p => ({ ...p, event_reminders_enabled: checked }))}
                  />
                </div>
              </div>

              <Separator />

              {/* City */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Sua Cidade
                </label>
                <Input
                  value={notifPrefs.city}
                  onChange={(e) => setNotifPrefs(p => ({ ...p, city: e.target.value }))}
                  placeholder="Ex: São Paulo, SP"
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Usado para previsão de clima nas sugestões de looks
                </p>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={saveNotifMutation.isPending}
                className="w-full rounded-xl gradient-primary dark:neon-button"
              >
                {saveNotifMutation.isPending ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </motion.section>

          {/* Account Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Conta
            </h2>

            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">Assinatura</p>
                    <p className="text-xs text-muted-foreground">Gerenciar seu plano</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <Separator />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-destructive"
              >
                <div className="p-2 rounded-full bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Sair da Conta</span>
              </button>
            </div>
          </motion.section>

          {/* Version info */}
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">
              Ethra Aura v1.0.0
            </p>
          </div>
        </div>
      </PageContainer>
      <BottomNav />
    </>
  );
}
