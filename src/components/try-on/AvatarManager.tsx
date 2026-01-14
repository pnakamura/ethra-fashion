import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, User, X, Loader2, Crown, Camera, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVirtualTryOn } from '@/hooks/useVirtualTryOn';
import { SmartCameraCapture } from './SmartCameraCapture';
import { PrivacySettings } from './PrivacySettings';

export function AvatarManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [showSmartCamera, setShowSmartCamera] = useState(false);
  const [blurFaceEnabled, setBlurFaceEnabled] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const {
    primaryAvatar,
    avatars,
    isLoadingAvatars,
    uploadAvatar,
    isUploadingAvatar,
    setPrimaryAvatar,
  } = useVirtualTryOn();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const handleSmartCameraCapture = (blob: Blob) => {
    const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
    uploadAvatar(file);
    setShowSmartCamera(false);
  };

  const handleSetPrimary = async (avatarId: string) => {
    setSettingPrimaryId(avatarId);
    try {
      await setPrimaryAvatar(avatarId);
    } finally {
      setSettingPrimaryId(null);
    }
  };

  // Show Smart Camera overlay
  if (showSmartCamera) {
    return (
      <SmartCameraCapture
        mode="avatar"
        onCapture={handleSmartCameraCapture}
        onCancel={() => setShowSmartCamera(false)}
      />
    );
  }

  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-medium">Seu Avatar</h3>
          {primaryAvatar && (
            <Badge variant="secondary" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Principal
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrivacy(!showPrivacy)}
            className={showPrivacy ? 'text-primary' : 'text-muted-foreground'}
          >
            <Shield className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-muted-foreground"
          >
            {showInstructions ? <X className="w-4 h-4" /> : 'Dicas'}
          </Button>
        </div>
      </div>

      {/* Privacy Settings */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <PrivacySettings
              blurFaceEnabled={blurFaceEnabled}
              onBlurFaceChange={setBlurFaceEnabled}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground"
          >
            <p className="font-medium text-foreground mb-2">Para melhores resultados:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Foto de corpo inteiro, pose frontal</li>
              <li>Roupa justa e neutra (preferência)</li>
              <li>Boa iluminação, fundo limpo</li>
              <li>Braços levemente afastados do corpo</li>
              <li>Pessoa centralizada na foto</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Avatar Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
          {primaryAvatar ? (
            <motion.img
              key={primaryAvatar.id}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              src={primaryAvatar.image_url}
              alt="Seu avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-muted-foreground" />
          )}
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1">
          {primaryAvatar ? (
            <div>
              <p className="text-sm font-medium text-foreground">Avatar configurado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pronto para provas virtuais
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-foreground">Nenhum avatar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione uma foto de corpo inteiro
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowSmartCamera(true)}
          disabled={isUploadingAvatar}
          className="flex-1 gradient-primary text-primary-foreground"
        >
          <Camera className="w-4 h-4 mr-2" />
          Câmera Inteligente
        </Button>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          variant="outline"
          size="icon"
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>

      {/* Avatar Gallery */}
      {avatars && avatars.length > 1 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            Toque em outro avatar para defini-lo como principal
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {avatars
              .filter((a) => a.id !== primaryAvatar?.id)
              .map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSetPrimary(avatar.id)}
                  disabled={settingPrimaryId === avatar.id}
                  className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-transparent hover:ring-primary/50 transition-all disabled:opacity-50"
                >
                  <img
                    src={avatar.image_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {settingPrimaryId === avatar.id && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </Card>
  );
}
