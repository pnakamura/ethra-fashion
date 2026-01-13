import { useTheme } from 'next-themes';

export function ArtBackground() {
  const { resolvedTheme } = useTheme();
  
  // Só exibir no modo escuro
  if (resolvedTheme !== 'dark') return null;
  
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
      {/* Imagem de fundo com opacidade muito baixa */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/art-background-2.jpeg)',
          opacity: 'var(--art-bg-opacity, 0.08)',
          filter: 'blur(var(--art-bg-blur, 1px))',
        }}
      />
      
      {/* Overlay de gradiente para suavizar */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at top, transparent 0%, hsl(235 50% 6%) 70%),
            linear-gradient(180deg, hsl(235 50% 6% / 0.3) 0%, hsl(235 50% 6% / 0.9) 100%)
          `
        }}
      />
    </div>
  );
}
