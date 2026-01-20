/**
 * Camera Permission Utilities
 * Handles camera permission checks and provides user-friendly feedback
 */

import { toast } from 'sonner';

export type CameraPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionStatus> {
  // Check if navigator.permissions is supported
  if (!navigator.permissions) {
    // Fallback: try to access camera directly
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state as CameraPermissionStatus;
  } catch {
    // Some browsers don't support querying camera permission
    return 'prompt';
  }
}

/**
 * Request camera access and handle errors
 */
export async function requestCameraAccess(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop the stream immediately - we just wanted to request permission
    stream.getTracks().forEach(track => track.stop());
    return stream;
  } catch (error) {
    handleCameraError(error);
    return null;
  }
}

/**
 * Handle camera errors with user-friendly toasts
 */
export function handleCameraError(error: unknown): void {
  const err = error as Error;
  const errorName = err.name || '';
  const errorMessage = err.message || '';

  console.error('[Camera] Error:', errorName, errorMessage);

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    showPermissionDeniedToast();
  } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    toast.error('Câmera não encontrada', {
      description: 'Nenhuma câmera foi detectada no seu dispositivo.',
      duration: 6000,
    });
  } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    toast.error('Câmera em uso', {
      description: 'A câmera pode estar sendo usada por outro aplicativo. Feche outros apps e tente novamente.',
      duration: 6000,
    });
  } else if (errorName === 'OverconstrainedError') {
    toast.error('Configuração de câmera incompatível', {
      description: 'Seu dispositivo não suporta as configurações solicitadas.',
      duration: 5000,
    });
  } else if (errorName === 'SecurityError') {
    toast.error('Erro de segurança', {
      description: 'O acesso à câmera foi bloqueado por política de segurança. Verifique se está usando HTTPS.',
      duration: 6000,
    });
  } else {
    toast.error('Erro ao acessar câmera', {
      description: 'Ocorreu um erro inesperado. Tente recarregar a página.',
      duration: 5000,
    });
  }
}

/**
 * Show toast with instructions to enable camera permission
 */
export function showPermissionDeniedToast(): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);

  let instructions = '';

  if (isIOS) {
    if (isSafari) {
      instructions = 'Vá em Ajustes > Safari > Câmera e selecione "Permitir".';
    } else {
      instructions = 'Vá em Ajustes > [Nome do navegador] > Câmera e ative a permissão.';
    }
  } else if (isAndroid) {
    if (isChrome) {
      instructions = 'Toque no ícone de cadeado na barra de endereço > Permissões > Câmera > Permitir.';
    } else {
      instructions = 'Acesse as configurações do navegador e habilite a permissão de câmera para este site.';
    }
  } else {
    // Desktop
    if (isChrome) {
      instructions = 'Clique no ícone de cadeado/câmera na barra de endereço e permita o acesso à câmera.';
    } else if (isSafari) {
      instructions = 'Vá em Safari > Preferências > Sites > Câmera e permita este site.';
    } else {
      instructions = 'Verifique as configurações de permissão do navegador e permita o acesso à câmera.';
    }
  }

  toast.error('Acesso à câmera negado', {
    description: instructions,
    duration: 8000,
    action: {
      label: 'Recarregar',
      onClick: () => window.location.reload(),
    },
  });
}

/**
 * Check if camera is available on the device
 */
export async function isCameraAvailable(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch {
    return false;
  }
}
