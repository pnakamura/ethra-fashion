/**
 * Privacy Settings Component
 * Displays privacy information and options for virtual try-on
 */

import { Shield, Check, Eye, EyeOff, Clock, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { PRIVACY_INFO } from '@/lib/privacy-utils';

interface PrivacySettingsProps {
  blurFaceEnabled: boolean;
  onBlurFaceChange: (enabled: boolean) => void;
  compact?: boolean;
}

export function PrivacySettings({
  blurFaceEnabled,
  onBlurFaceChange,
  compact = false
}: PrivacySettingsProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Privacidade</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {blurFaceEnabled ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Blur ativo</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Sem blur</span>
              </>
            )}
          </div>
          <Switch checked={blurFaceEnabled} onCheckedChange={onBlurFaceChange} />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-medium">Sua Privacidade</h3>
      </div>

      {/* Blur Face Toggle */}
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          {blurFaceEnabled ? (
            <EyeOff className="w-5 h-5 text-primary" />
          ) : (
            <Eye className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">Anonimizar rosto</p>
            <p className="text-xs text-muted-foreground">
              Aplica blur antes do upload
            </p>
          </div>
        </div>
        <Switch checked={blurFaceEnabled} onCheckedChange={onBlurFaceChange} />
      </div>

      {/* Privacy Guarantees */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{PRIVACY_INFO.localProcessing.title}</p>
            <p className="text-xs text-muted-foreground">
              {PRIVACY_INFO.localProcessing.description}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{PRIVACY_INFO.tempStorage.title}</p>
            <p className="text-xs text-muted-foreground">
              {PRIVACY_INFO.tempStorage.description}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium">{PRIVACY_INFO.noOriginal.title}</p>
            <p className="text-xs text-muted-foreground">
              {PRIVACY_INFO.noOriginal.description}
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg text-center">
        <p className="text-xs text-primary font-medium">
          🔒 Processamento 100% local para blur facial
        </p>
      </div>
    </Card>
  );
}
