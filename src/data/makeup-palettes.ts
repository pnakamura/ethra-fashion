// Complete makeup palette data for all 12 chromatic seasons
// Each season has recommended and avoid colors for different makeup categories

export interface MakeupProduct {
  hex: string;
  name: string;
  finish?: 'matte' | 'satin' | 'gloss' | 'shimmer' | 'metallic' | 'cream';
  intensity?: 'sheer' | 'medium' | 'full';
  description?: string;
}

export interface MakeupCategory {
  lips: MakeupProduct[];
  eyeshadow: MakeupProduct[];
  eyeliner: MakeupProduct[];
  blush: MakeupProduct[];
  contour: MakeupProduct[];
  highlighter: MakeupProduct[];
  nails: MakeupProduct[];
}

export interface SeasonMakeup {
  seasonId: string;
  seasonName: string;
  seasonSubtype: string;
  recommended: MakeupCategory;
  avoid: MakeupCategory;
}

export const makeupPalettes: SeasonMakeup[] = [
  // SPRING LIGHT - Primavera Clara
  {
    seasonId: 'spring-light',
    seasonName: 'Primavera',
    seasonSubtype: 'Clara',
    recommended: {
      lips: [
        { hex: '#FF7F7F', name: 'Coral Claro', finish: 'satin', intensity: 'medium', description: 'Tom fresco e jovial' },
        { hex: '#FFCBA4', name: 'Pêssego', finish: 'gloss', intensity: 'sheer', description: 'Natural e luminoso' },
        { hex: '#E8B4B8', name: 'Rosa Quente', finish: 'satin', intensity: 'medium', description: 'Romântico' },
        { hex: '#D4A5A5', name: 'Nude Rosado', finish: 'matte', intensity: 'medium', description: 'Discreto e elegante' },
        { hex: '#FFB07C', name: 'Pêssego Intenso', finish: 'cream', intensity: 'full', description: 'Vibrante para noite' },
        { hex: '#F5A9A9', name: 'Rosa Coral', finish: 'gloss', intensity: 'sheer', description: 'Dia a dia perfeito' },
      ],
      eyeshadow: [
        { hex: '#D4AF37', name: 'Dourado', finish: 'shimmer', intensity: 'medium', description: 'Ilumina o olhar' },
        { hex: '#FFCBA4', name: 'Pêssego', finish: 'matte', intensity: 'medium', description: 'Transição ideal' },
        { hex: '#7FCDCD', name: 'Verde-água', finish: 'satin', intensity: 'medium', description: 'Destaque delicado' },
        { hex: '#C4A484', name: 'Marrom Claro', finish: 'matte', intensity: 'medium', description: 'Côncavo perfeito' },
        { hex: '#F0E68C', name: 'Champagne', finish: 'shimmer', intensity: 'sheer', description: 'Canto interno' },
        { hex: '#DEB887', name: 'Camurça', finish: 'matte', intensity: 'full', description: 'Profundidade suave' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Quente', finish: 'matte', description: 'Suave e definido' },
        { hex: '#D4AF37', name: 'Dourado', finish: 'metallic', description: 'Festivo' },
        { hex: '#228B22', name: 'Verde Floresta', finish: 'matte', description: 'Alternativa elegante' },
        { hex: '#CD853F', name: 'Bronze', finish: 'metallic', description: 'Glamour natural' },
      ],
      blush: [
        { hex: '#FFCBA4', name: 'Pêssego', finish: 'matte', intensity: 'medium', description: 'Frescor natural' },
        { hex: '#FFB07C', name: 'Coral Suave', finish: 'satin', intensity: 'medium', description: 'Glow saudável' },
        { hex: '#F5A9A9', name: 'Rosa Alaranjado', finish: 'cream', intensity: 'sheer', description: 'Sutileza' },
        { hex: '#FFDAB9', name: 'Pêssego Claro', finish: 'shimmer', intensity: 'sheer', description: 'Iluminador natural' },
      ],
      contour: [
        { hex: '#C4A484', name: 'Bege Dourado', finish: 'matte', description: 'Esculpe sem pesar' },
        { hex: '#D2B48C', name: 'Bronzer Claro', finish: 'matte', description: 'Aquece a pele' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', finish: 'shimmer', description: 'Brilho solar' },
        { hex: '#FFFACD', name: 'Champagne', finish: 'shimmer', description: 'Delicado e luminoso' },
        { hex: '#FFEFD5', name: 'Pêssego Glow', finish: 'shimmer', description: 'Efeito natural' },
      ],
      nails: [
        { hex: '#D4A5A5', name: 'Nude Rosado', finish: 'cream', description: 'Clássico' },
        { hex: '#FF7F7F', name: 'Coral', finish: 'cream', description: 'Alegre' },
        { hex: '#FFB6C1', name: 'Rosa Claro', finish: 'cream', description: 'Romântico' },
        { hex: '#FFCBA4', name: 'Pêssego', finish: 'cream', description: 'Natural' },
        { hex: '#FFDAB9', name: 'Nude Pêssego', finish: 'cream', description: 'Elegante' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#8B0000', name: 'Vermelho Escuro', description: 'Peso excessivo para sua leveza' },
        { hex: '#800020', name: 'Borgonha', description: 'Muito profundo' },
        { hex: '#4B0082', name: 'Roxo Escuro', description: 'Apaga sua luminosidade' },
      ],
      eyeshadow: [
        { hex: '#000000', name: 'Preto', description: 'Muito pesado' },
        { hex: '#4B0082', name: 'Índigo', description: 'Frio demais' },
        { hex: '#708090', name: 'Cinza Ardósia', description: 'Apaga o olhar' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Intenso', description: 'Prefira marrom' },
      ],
      blush: [
        { hex: '#C71585', name: 'Rosa Frio', description: 'Conflita com seu calor' },
        { hex: '#8B4513', name: 'Terracota Escuro', description: 'Pesado demais' },
      ],
      contour: [
        { hex: '#696969', name: 'Cinza', description: 'Esfria a pele' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
      ],
      nails: [
        { hex: '#000000', name: 'Preto', description: 'Muito pesado' },
        { hex: '#4B0082', name: 'Roxo Escuro', description: 'Contraste excessivo' },
      ],
    },
  },

  // SPRING WARM - Primavera Quente
  {
    seasonId: 'spring-warm',
    seasonName: 'Primavera',
    seasonSubtype: 'Quente',
    recommended: {
      lips: [
        { hex: '#FF6347', name: 'Laranja Tomate', finish: 'matte', intensity: 'full', description: 'Statement vibrante' },
        { hex: '#CC4E4E', name: 'Terracota', finish: 'satin', intensity: 'medium', description: 'Quente e sofisticado' },
        { hex: '#FF7F50', name: 'Coral Vibrante', finish: 'cream', intensity: 'full', description: 'Alegre e vivo' },
        { hex: '#E25822', name: 'Vermelho Tomate', finish: 'matte', intensity: 'full', description: 'Impactante' },
        { hex: '#CD853F', name: 'Caramelo', finish: 'gloss', intensity: 'medium', description: 'Nude quente' },
        { hex: '#D2691E', name: 'Tijolo', finish: 'matte', intensity: 'full', description: 'Terroso chic' },
      ],
      eyeshadow: [
        { hex: '#CD7F32', name: 'Bronze', finish: 'metallic', intensity: 'full', description: 'Luxuoso e quente' },
        { hex: '#B87333', name: 'Cobre', finish: 'shimmer', intensity: 'full', description: 'Brilho intenso' },
        { hex: '#CC4E4E', name: 'Terracota', finish: 'matte', intensity: 'medium', description: 'Profundidade' },
        { hex: '#808000', name: 'Oliva', finish: 'satin', intensity: 'medium', description: 'Verde terroso' },
        { hex: '#D4AF37', name: 'Ouro', finish: 'metallic', intensity: 'full', description: 'Glamour máximo' },
        { hex: '#8B4513', name: 'Marrom Quente', finish: 'matte', intensity: 'full', description: 'Definição' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Chocolate', finish: 'matte', description: 'Clássico quente' },
        { hex: '#B87333', name: 'Cobre', finish: 'metallic', description: 'Sofisticado' },
        { hex: '#228B22', name: 'Verde Oliva', finish: 'matte', description: 'Realça olhos claros' },
        { hex: '#D4AF37', name: 'Dourado', finish: 'metallic', description: 'Festivo' },
      ],
      blush: [
        { hex: '#CC4E4E', name: 'Terracota', finish: 'matte', intensity: 'medium', description: 'Bronze saudável' },
        { hex: '#FF7F50', name: 'Coral Intenso', finish: 'satin', intensity: 'full', description: 'Vibrante' },
        { hex: '#CD853F', name: 'Pêssego Dourado', finish: 'shimmer', intensity: 'medium', description: 'Glow quente' },
        { hex: '#D2691E', name: 'Tijolo Suave', finish: 'matte', intensity: 'medium', description: 'Natural' },
      ],
      contour: [
        { hex: '#8B4513', name: 'Marrom Quente', finish: 'matte', description: 'Esculpe com calor' },
        { hex: '#A0522D', name: 'Sienna', finish: 'matte', description: 'Bronze natural' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Ouro', finish: 'metallic', description: 'Brilho solar' },
        { hex: '#B87333', name: 'Cobre', finish: 'shimmer', description: 'Calor metálico' },
        { hex: '#FFDAB9', name: 'Pêssego', finish: 'shimmer', description: 'Suave' },
      ],
      nails: [
        { hex: '#FF6347', name: 'Laranja', finish: 'cream', description: 'Vibrante' },
        { hex: '#FF7F50', name: 'Coral', finish: 'cream', description: 'Alegre' },
        { hex: '#CD853F', name: 'Nude Alaranjado', finish: 'cream', description: 'Natural' },
        { hex: '#CC4E4E', name: 'Terracota', finish: 'cream', description: 'Sofisticado' },
        { hex: '#D4AF37', name: 'Dourado', finish: 'metallic', description: 'Festivo' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF69B4', name: 'Rosa Frio', description: 'Conflita com seu calor' },
        { hex: '#C71585', name: 'Magenta', description: 'Subtom azulado' },
        { hex: '#8B008B', name: 'Roxo Frio', description: 'Desarmônico' },
      ],
      eyeshadow: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#4169E1', name: 'Azul Royal', description: 'Frio demais' },
        { hex: '#9370DB', name: 'Púrpura Frio', description: 'Subtom incompatível' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Frio', description: 'Prefira marrom' },
        { hex: '#0000CD', name: 'Azul', description: 'Muito frio' },
      ],
      blush: [
        { hex: '#FFC0CB', name: 'Rosa Bebê', description: 'Frio demais' },
        { hex: '#DDA0DD', name: 'Malva', description: 'Subtom roxo' },
      ],
      contour: [
        { hex: '#808080', name: 'Cinza', description: 'Esfria a pele' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Conflita com calor' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Frio demais' },
      ],
      nails: [
        { hex: '#FF69B4', name: 'Rosa Frio', description: 'Desarmônico' },
        { hex: '#9370DB', name: 'Lilás', description: 'Muito frio' },
      ],
    },
  },

  // SPRING BRIGHT - Primavera Brilhante
  {
    seasonId: 'spring-bright',
    seasonName: 'Primavera',
    seasonSubtype: 'Brilhante',
    recommended: {
      lips: [
        { hex: '#FF1493', name: 'Fúcsia', finish: 'matte', intensity: 'full', description: 'Impacto máximo' },
        { hex: '#FF0000', name: 'Vermelho Vivo', finish: 'satin', intensity: 'full', description: 'Clássico vibrante' },
        { hex: '#FF4500', name: 'Laranja Neon', finish: 'matte', intensity: 'full', description: 'Ousado' },
        { hex: '#FF69B4', name: 'Rosa Chiclete', finish: 'gloss', intensity: 'full', description: 'Divertido' },
        { hex: '#FF6B6B', name: 'Coral Vivo', finish: 'cream', intensity: 'full', description: 'Energético' },
        { hex: '#FF7F50', name: 'Coral Neon', finish: 'satin', intensity: 'full', description: 'Statement' },
      ],
      eyeshadow: [
        { hex: '#00CED1', name: 'Turquesa', finish: 'shimmer', intensity: 'full', description: 'Vibrante' },
        { hex: '#FFD700', name: 'Dourado Brilhante', finish: 'metallic', intensity: 'full', description: 'Luxo' },
        { hex: '#9932CC', name: 'Roxo Elétrico', finish: 'shimmer', intensity: 'full', description: 'Dramático' },
        { hex: '#32CD32', name: 'Verde Esmeralda', finish: 'shimmer', intensity: 'full', description: 'Intenso' },
        { hex: '#FF1493', name: 'Pink', finish: 'shimmer', intensity: 'full', description: 'Pop' },
        { hex: '#4169E1', name: 'Azul Royal', finish: 'shimmer', intensity: 'full', description: 'Bold' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Intenso', finish: 'matte', description: 'Definição máxima' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'metallic', description: 'Criativo' },
        { hex: '#FF1493', name: 'Pink', finish: 'matte', description: 'Divertido' },
        { hex: '#FFD700', name: 'Dourado', finish: 'metallic', description: 'Glamour' },
      ],
      blush: [
        { hex: '#FF1493', name: 'Pink Vibrante', finish: 'matte', intensity: 'full', description: 'Impacto' },
        { hex: '#FF6B6B', name: 'Coral Intenso', finish: 'satin', intensity: 'full', description: 'Energia' },
        { hex: '#FF7F50', name: 'Pêssego Vivo', finish: 'shimmer', intensity: 'medium', description: 'Glow' },
        { hex: '#FF4500', name: 'Laranja', finish: 'matte', intensity: 'medium', description: 'Ousado' },
      ],
      contour: [
        { hex: '#8B4513', name: 'Bronzer Intenso', finish: 'matte', description: 'Definição forte' },
        { hex: '#A0522D', name: 'Terracota', finish: 'matte', description: 'Calor' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Ouro Brilhante', finish: 'metallic', description: 'Máximo impacto' },
        { hex: '#FF69B4', name: 'Pink Glow', finish: 'shimmer', description: 'Holográfico' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'shimmer', description: 'Criativo' },
      ],
      nails: [
        { hex: '#FF1493', name: 'Fúcsia', finish: 'cream', description: 'Statement' },
        { hex: '#FF4500', name: 'Neon Orange', finish: 'cream', description: 'Ousado' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'cream', description: 'Pop' },
        { hex: '#FFD700', name: 'Dourado', finish: 'metallic', description: 'Luxo' },
        { hex: '#FF0000', name: 'Vermelho Vivo', finish: 'cream', description: 'Clássico' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#BC8F8F', name: 'Rosa Empoeirado', description: 'Muito apagado' },
        { hex: '#D8BFD8', name: 'Malva Suave', description: 'Sem vida' },
        { hex: '#A9A9A9', name: 'Nude Acinzentado', description: 'Opaco' },
      ],
      eyeshadow: [
        { hex: '#808080', name: 'Cinza Médio', description: 'Sem brilho' },
        { hex: '#BC8F8F', name: 'Rosa Antigo', description: 'Apagado' },
        { hex: '#556B2F', name: 'Oliva Opaco', description: 'Sem vida' },
      ],
      eyeliner: [
        { hex: '#696969', name: 'Cinza', description: 'Muito neutro' },
      ],
      blush: [
        { hex: '#BC8F8F', name: 'Rosa Dusty', description: 'Apaga seu brilho' },
        { hex: '#C4B7A6', name: 'Taupe', description: 'Muito neutro' },
      ],
      contour: [
        { hex: '#808080', name: 'Cinza Frio', description: 'Sem vida' },
      ],
      highlighter: [
        { hex: '#DCDCDC', name: 'Prata Suave', description: 'Muito discreto' },
      ],
      nails: [
        { hex: '#D8BFD8', name: 'Malva', description: 'Apagado' },
        { hex: '#C4B7A6', name: 'Greige', description: 'Sem vida' },
      ],
    },
  },

  // SUMMER LIGHT - Verão Claro
  {
    seasonId: 'summer-light',
    seasonName: 'Verão',
    seasonSubtype: 'Claro',
    recommended: {
      lips: [
        { hex: '#DDA0DD', name: 'Rosa Frio', finish: 'satin', intensity: 'medium', description: 'Delicado' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'cream', intensity: 'medium', description: 'Elegante' },
        { hex: '#CD5C5C', name: 'Berry Claro', finish: 'satin', intensity: 'medium', description: 'Romântico' },
        { hex: '#C4AEAD', name: 'Nude Rosado Frio', finish: 'matte', intensity: 'medium', description: 'Natural' },
        { hex: '#DB7093', name: 'Rosa Antigo', finish: 'cream', intensity: 'medium', description: 'Sofisticado' },
        { hex: '#E6E6FA', name: 'Lavanda Suave', finish: 'gloss', intensity: 'sheer', description: 'Etéreo' },
      ],
      eyeshadow: [
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'shimmer', intensity: 'medium', description: 'Sua cor assinatura' },
        { hex: '#C0C0C0', name: 'Cinza Prateado', finish: 'shimmer', intensity: 'medium', description: 'Elegante' },
        { hex: '#FFB6C1', name: 'Rosa Suave', finish: 'matte', intensity: 'medium', description: 'Romântico' },
        { hex: '#ADD8E6', name: 'Azul Gelo', finish: 'satin', intensity: 'medium', description: 'Fresco' },
        { hex: '#DDA0DD', name: 'Ameixa Clara', finish: 'satin', intensity: 'medium', description: 'Profundidade suave' },
        { hex: '#778899', name: 'Cinza Azulado', finish: 'matte', intensity: 'medium', description: 'Definição' },
      ],
      eyeliner: [
        { hex: '#778899', name: 'Cinza Ardósia', finish: 'matte', description: 'Suave' },
        { hex: '#4B0082', name: 'Roxo Escuro', finish: 'matte', description: 'Elegante' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Festivo' },
        { hex: '#483D8B', name: 'Azul Escuro', finish: 'matte', description: 'Sofisticado' },
      ],
      blush: [
        { hex: '#FFB6C1', name: 'Rosa Frio', finish: 'matte', intensity: 'medium', description: 'Natural' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'satin', intensity: 'medium', description: 'Suave' },
        { hex: '#CD5C5C', name: 'Berry Suave', finish: 'cream', intensity: 'sheer', description: 'Romântico' },
        { hex: '#DDA0DD', name: 'Lavanda Rosa', finish: 'shimmer', intensity: 'sheer', description: 'Etéreo' },
      ],
      contour: [
        { hex: '#C4AEAD', name: 'Taupe Rosado', finish: 'matte', description: 'Esculpe suavemente' },
        { hex: '#A9A9A9', name: 'Cinza Suave', finish: 'matte', description: 'Definição leve' },
      ],
      highlighter: [
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'shimmer', description: 'Etéreo' },
        { hex: '#FFC0CB', name: 'Rosa', finish: 'shimmer', description: 'Delicado' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'shimmer', description: 'Frio e luminoso' },
      ],
      nails: [
        { hex: '#FFB6C1', name: 'Rosa Claro', finish: 'cream', description: 'Romântico' },
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'cream', description: 'Etéreo' },
        { hex: '#C4AEAD', name: 'Nude Frio', finish: 'cream', description: 'Clássico' },
        { hex: '#DCDCDC', name: 'Cinza Claro', finish: 'cream', description: 'Moderno' },
        { hex: '#F5F5F5', name: 'French', finish: 'cream', description: 'Elegante' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF4500', name: 'Laranja', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor excessivo' },
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Peso e calor' },
      ],
      eyeshadow: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#FF6347', name: 'Laranja', description: 'Conflita com frescor' },
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Calor excessivo' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Prefira cinza' },
      ],
      blush: [
        { hex: '#FF7F50', name: 'Coral Quente', description: 'Conflita com seu frescor' },
        { hex: '#CC4E4E', name: 'Terracota', description: 'Muito quente' },
      ],
      contour: [
        { hex: '#D2691E', name: 'Bronze', description: 'Calor demais' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#B87333', name: 'Cobre', description: 'Conflita com frescor' },
      ],
      nails: [
        { hex: '#FF6347', name: 'Laranja', description: 'Muito quente' },
        { hex: '#FFD700', name: 'Dourado', description: 'Calor excessivo' },
      ],
    },
  },

  // SUMMER SOFT - Verão Suave
  {
    seasonId: 'summer-soft',
    seasonName: 'Verão',
    seasonSubtype: 'Suave',
    recommended: {
      lips: [
        { hex: '#BC8F8F', name: 'Rosa Antigo', finish: 'satin', intensity: 'medium', description: 'Elegante e versátil' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'cream', intensity: 'medium', description: 'Sofisticado' },
        { hex: '#C4AEAD', name: 'Nude Rosado', finish: 'matte', intensity: 'medium', description: 'Natural' },
        { hex: '#CD5C5C', name: 'Berry Suave', finish: 'satin', intensity: 'medium', description: 'Romântico' },
        { hex: '#A9A9A9', name: 'Mauve', finish: 'matte', intensity: 'medium', description: 'Discreto' },
        { hex: '#DB7093', name: 'Rosa Médio', finish: 'cream', intensity: 'medium', description: 'Equilibrado' },
      ],
      eyeshadow: [
        { hex: '#C4B7A6', name: 'Taupe', finish: 'matte', intensity: 'medium', description: 'Seu neutro perfeito' },
        { hex: '#A9A9A9', name: 'Cinza', finish: 'satin', intensity: 'medium', description: 'Elegante' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'shimmer', intensity: 'medium', description: 'Sofisticado' },
        { hex: '#BC8F8F', name: 'Ameixa Suave', finish: 'matte', intensity: 'medium', description: 'Profundidade' },
        { hex: '#778899', name: 'Cinza Azulado', finish: 'matte', intensity: 'medium', description: 'Definição' },
        { hex: '#5F9EA0', name: 'Teal Suave', finish: 'satin', intensity: 'medium', description: 'Destaque discreto' },
      ],
      eyeliner: [
        { hex: '#696969', name: 'Cinza Escuro', finish: 'matte', description: 'Suave' },
        { hex: '#8B7D7B', name: 'Castor', finish: 'matte', description: 'Natural' },
        { hex: '#483D8B', name: 'Roxo Escuro', finish: 'matte', description: 'Elegante' },
        { hex: '#2F4F4F', name: 'Teal', finish: 'matte', description: 'Sofisticado' },
      ],
      blush: [
        { hex: '#BC8F8F', name: 'Rosa Dusty', finish: 'matte', intensity: 'medium', description: 'Seu tom ideal' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'satin', intensity: 'medium', description: 'Suave' },
        { hex: '#C4AEAD', name: 'Pêssego Rosado', finish: 'cream', intensity: 'sheer', description: 'Natural' },
        { hex: '#CD5C5C', name: 'Berry', finish: 'matte', intensity: 'sheer', description: 'Romântico' },
      ],
      contour: [
        { hex: '#C4B7A6', name: 'Taupe', finish: 'matte', description: 'Esculpe naturalmente' },
        { hex: '#8B7D7B', name: 'Castor', finish: 'matte', description: 'Definição suave' },
      ],
      highlighter: [
        { hex: '#DCDCDC', name: 'Champagne Frio', finish: 'shimmer', description: 'Delicado' },
        { hex: '#D8BFD8', name: 'Lavanda', finish: 'shimmer', description: 'Suave' },
        { hex: '#C0C0C0', name: 'Prata Suave', finish: 'shimmer', description: 'Discreto' },
      ],
      nails: [
        { hex: '#C4AEAD', name: 'Nude', finish: 'cream', description: 'Clássico' },
        { hex: '#E8E4E1', name: 'Greige', finish: 'cream', description: 'Moderno' },
        { hex: '#BC8F8F', name: 'Rosa Antigo', finish: 'cream', description: 'Elegante' },
        { hex: '#D8BFD8', name: 'Malva', finish: 'cream', description: 'Sofisticado' },
        { hex: '#A9A9A9', name: 'Cinza', finish: 'cream', description: 'Minimal' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF0000', name: 'Vermelho Vivo', description: 'Saturação excessiva' },
        { hex: '#FF1493', name: 'Pink Neon', description: 'Muito vibrante' },
        { hex: '#FF6347', name: 'Laranja', description: 'Muito saturado' },
      ],
      eyeshadow: [
        { hex: '#00FF00', name: 'Verde Neon', description: 'Muito vibrante' },
        { hex: '#FF1493', name: 'Pink Elétrico', description: 'Saturação demais' },
        { hex: '#FFD700', name: 'Dourado Brilhante', description: 'Muito intenso' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Puro', description: 'Prefira cinza carvão' },
      ],
      blush: [
        { hex: '#FF4500', name: 'Laranja', description: 'Muito vibrante' },
        { hex: '#FF1493', name: 'Pink Vivo', description: 'Saturação demais' },
      ],
      contour: [
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Muito quente' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito intenso' },
        { hex: '#FF69B4', name: 'Pink', description: 'Saturação demais' },
      ],
      nails: [
        { hex: '#FF0000', name: 'Vermelho Vivo', description: 'Muito vibrante' },
        { hex: '#00FF00', name: 'Neon', description: 'Cores vibrantes' },
      ],
    },
  },

  // SUMMER COOL - Verão Frio
  {
    seasonId: 'summer-cool',
    seasonName: 'Verão',
    seasonSubtype: 'Frio',
    recommended: {
      lips: [
        { hex: '#C71585', name: 'Framboesa', finish: 'matte', intensity: 'full', description: 'Impactante' },
        { hex: '#DB7093', name: 'Rosa Frio', finish: 'satin', intensity: 'medium', description: 'Elegante' },
        { hex: '#8B008B', name: 'Ameixa', finish: 'matte', intensity: 'full', description: 'Sofisticado' },
        { hex: '#BA55D3', name: 'Orquídea', finish: 'cream', intensity: 'medium', description: 'Romântico' },
        { hex: '#CD5C5C', name: 'Berry', finish: 'satin', intensity: 'medium', description: 'Versátil' },
        { hex: '#9370DB', name: 'Púrpura Médio', finish: 'matte', intensity: 'medium', description: 'Statement' },
      ],
      eyeshadow: [
        { hex: '#9370DB', name: 'Púrpura', finish: 'shimmer', intensity: 'full', description: 'Dramático' },
        { hex: '#4682B4', name: 'Azul Aço', finish: 'satin', intensity: 'medium', description: 'Elegante' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', intensity: 'full', description: 'Sofisticado' },
        { hex: '#8B008B', name: 'Ameixa', finish: 'matte', intensity: 'full', description: 'Intenso' },
        { hex: '#778899', name: 'Cinza Azulado', finish: 'matte', intensity: 'medium', description: 'Base perfeita' },
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'shimmer', intensity: 'medium', description: 'Iluminador' },
      ],
      eyeliner: [
        { hex: '#4B0082', name: 'Índigo', finish: 'matte', description: 'Dramático' },
        { hex: '#000080', name: 'Azul Marinho', finish: 'matte', description: 'Sofisticado' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Festivo' },
        { hex: '#2F4F4F', name: 'Cinza Escuro', finish: 'matte', description: 'Clássico' },
      ],
      blush: [
        { hex: '#DB7093', name: 'Rosa Frio', finish: 'matte', intensity: 'medium', description: 'Elegante' },
        { hex: '#BA55D3', name: 'Orquídea', finish: 'satin', intensity: 'medium', description: 'Romântico' },
        { hex: '#CD5C5C', name: 'Berry', finish: 'cream', intensity: 'medium', description: 'Versátil' },
        { hex: '#9370DB', name: 'Lavanda Rosa', finish: 'shimmer', intensity: 'sheer', description: 'Suave' },
      ],
      contour: [
        { hex: '#778899', name: 'Cinza Taupe', finish: 'matte', description: 'Esculpe sem calor' },
        { hex: '#696969', name: 'Cinza Frio', finish: 'matte', description: 'Definição' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Sofisticado' },
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'shimmer', description: 'Etéreo' },
        { hex: '#FFC0CB', name: 'Rosa Frio', finish: 'shimmer', description: 'Delicado' },
      ],
      nails: [
        { hex: '#C71585', name: 'Framboesa', finish: 'cream', description: 'Statement' },
        { hex: '#9370DB', name: 'Púrpura', finish: 'cream', description: 'Elegante' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
        { hex: '#DB7093', name: 'Rosa Frio', finish: 'cream', description: 'Romântico' },
        { hex: '#000080', name: 'Azul Marinho', finish: 'cream', description: 'Sofisticado' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF6347', name: 'Laranja', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor excessivo' },
        { hex: '#FF7F50', name: 'Coral Quente', description: 'Conflita com frescor' },
      ],
      eyeshadow: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#B87333', name: 'Cobre', description: 'Calor demais' },
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Conflita' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Prefira azul ou preto' },
      ],
      blush: [
        { hex: '#FF7F50', name: 'Coral', description: 'Muito quente' },
        { hex: '#CC4E4E', name: 'Terracota', description: 'Calor excessivo' },
      ],
      contour: [
        { hex: '#D2691E', name: 'Bronze', description: 'Muito quente' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', description: 'Calor demais' },
        { hex: '#B87333', name: 'Cobre', description: 'Conflita' },
      ],
      nails: [
        { hex: '#FF6347', name: 'Laranja', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor excessivo' },
      ],
    },
  },

  // AUTUMN SOFT - Outono Suave
  {
    seasonId: 'autumn-soft',
    seasonName: 'Outono',
    seasonSubtype: 'Suave',
    recommended: {
      lips: [
        { hex: '#BC8F8F', name: 'Rosa Quente', finish: 'satin', intensity: 'medium', description: 'Elegante' },
        { hex: '#D2691E', name: 'Terracota Suave', finish: 'cream', intensity: 'medium', description: 'Natural' },
        { hex: '#C4A484', name: 'Nude Quente', finish: 'matte', intensity: 'medium', description: 'Discreto' },
        { hex: '#CD853F', name: 'Caramelo', finish: 'gloss', intensity: 'medium', description: 'Dourado' },
        { hex: '#A0522D', name: 'Sienna', finish: 'matte', intensity: 'medium', description: 'Terroso' },
        { hex: '#DEB887', name: 'Bege Rosado', finish: 'cream', intensity: 'sheer', description: 'Natural' },
      ],
      eyeshadow: [
        { hex: '#C4B7A6', name: 'Taupe Quente', finish: 'matte', intensity: 'medium', description: 'Base ideal' },
        { hex: '#8B7355', name: 'Marrom Suave', finish: 'matte', intensity: 'medium', description: 'Profundidade' },
        { hex: '#BC8F8F', name: 'Rosa Terroso', finish: 'satin', intensity: 'medium', description: 'Romântico' },
        { hex: '#808000', name: 'Oliva Suave', finish: 'satin', intensity: 'medium', description: 'Natural' },
        { hex: '#D4AF37', name: 'Dourado Suave', finish: 'shimmer', intensity: 'medium', description: 'Iluminador' },
        { hex: '#CD853F', name: 'Cobre Suave', finish: 'shimmer', intensity: 'medium', description: 'Destaque' },
      ],
      eyeliner: [
        { hex: '#8B7355', name: 'Marrom Médio', finish: 'matte', description: 'Natural' },
        { hex: '#556B2F', name: 'Verde Oliva', finish: 'matte', description: 'Sofisticado' },
        { hex: '#CD853F', name: 'Bronze', finish: 'metallic', description: 'Elegante' },
        { hex: '#696969', name: 'Cinza Quente', finish: 'matte', description: 'Suave' },
      ],
      blush: [
        { hex: '#D2691E', name: 'Terracota Suave', finish: 'matte', intensity: 'medium', description: 'Natural' },
        { hex: '#BC8F8F', name: 'Rosa Quente', finish: 'satin', intensity: 'medium', description: 'Suave' },
        { hex: '#CD853F', name: 'Pêssego Dourado', finish: 'shimmer', intensity: 'sheer', description: 'Glow' },
        { hex: '#DEB887', name: 'Nude', finish: 'matte', intensity: 'sheer', description: 'Discreto' },
      ],
      contour: [
        { hex: '#8B7355', name: 'Taupe Quente', finish: 'matte', description: 'Esculpe naturalmente' },
        { hex: '#A0522D', name: 'Sienna', finish: 'matte', description: 'Bronze suave' },
      ],
      highlighter: [
        { hex: '#D4AF37', name: 'Dourado Suave', finish: 'shimmer', description: 'Calor' },
        { hex: '#FFDAB9', name: 'Champagne', finish: 'shimmer', description: 'Delicado' },
        { hex: '#CD853F', name: 'Bronze', finish: 'shimmer', description: 'Terroso' },
      ],
      nails: [
        { hex: '#C4A484', name: 'Nude Quente', finish: 'cream', description: 'Natural' },
        { hex: '#D2691E', name: 'Terracota', finish: 'cream', description: 'Elegante' },
        { hex: '#BC8F8F', name: 'Rosa Terroso', finish: 'cream', description: 'Suave' },
        { hex: '#556B2F', name: 'Verde Oliva', finish: 'cream', description: 'Sofisticado' },
        { hex: '#CD853F', name: 'Caramelo', finish: 'cream', description: 'Dourado' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF1493', name: 'Pink Vibrante', description: 'Muito saturado' },
        { hex: '#FF0000', name: 'Vermelho Vivo', description: 'Contraste demais' },
        { hex: '#4B0082', name: 'Roxo Frio', description: 'Muito frio' },
      ],
      eyeshadow: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#FF1493', name: 'Pink', description: 'Saturação demais' },
        { hex: '#000000', name: 'Preto', description: 'Muito pesado' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Puro', description: 'Prefira marrom' },
      ],
      blush: [
        { hex: '#FF69B4', name: 'Pink Frio', description: 'Conflita com calor' },
        { hex: '#C71585', name: 'Framboesa', description: 'Muito saturado' },
      ],
      contour: [
        { hex: '#808080', name: 'Cinza Frio', description: 'Esfria a pele' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Conflita' },
      ],
      nails: [
        { hex: '#FF1493', name: 'Pink Frio', description: 'Muito saturado' },
        { hex: '#9370DB', name: 'Lilás', description: 'Muito frio' },
      ],
    },
  },

  // AUTUMN WARM - Outono Quente (True Autumn)
  {
    seasonId: 'autumn-warm',
    seasonName: 'Outono',
    seasonSubtype: 'Quente',
    recommended: {
      lips: [
        { hex: '#D2691E', name: 'Terracota', finish: 'matte', intensity: 'full', description: 'Seu tom ideal' },
        { hex: '#8B4513', name: 'Marrom Chocolate', finish: 'cream', intensity: 'full', description: 'Sofisticado' },
        { hex: '#CD853F', name: 'Cobre', finish: 'satin', intensity: 'full', description: 'Quente e luxuoso' },
        { hex: '#A0522D', name: 'Tijolo', finish: 'matte', intensity: 'full', description: 'Statement' },
        { hex: '#B8860B', name: 'Dourado Escuro', finish: 'metallic', intensity: 'medium', description: 'Glamour' },
        { hex: '#8B0000', name: 'Vermelho Tijolo', finish: 'matte', intensity: 'full', description: 'Impactante' },
      ],
      eyeshadow: [
        { hex: '#CD7F32', name: 'Bronze', finish: 'metallic', intensity: 'full', description: 'Luxuoso' },
        { hex: '#228B22', name: 'Verde Floresta', finish: 'satin', intensity: 'full', description: 'Dramático' },
        { hex: '#8B4513', name: 'Marrom Intenso', finish: 'matte', intensity: 'full', description: 'Profundidade' },
        { hex: '#B87333', name: 'Cobre', finish: 'metallic', intensity: 'full', description: 'Brilho quente' },
        { hex: '#808000', name: 'Oliva', finish: 'satin', intensity: 'full', description: 'Terroso' },
        { hex: '#D4AF37', name: 'Ouro', finish: 'metallic', intensity: 'full', description: 'Festivo' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Chocolate', finish: 'matte', description: 'Clássico' },
        { hex: '#228B22', name: 'Verde Escuro', finish: 'matte', description: 'Alternativa elegante' },
        { hex: '#B87333', name: 'Cobre', finish: 'metallic', description: 'Sofisticado' },
        { hex: '#D4AF37', name: 'Dourado', finish: 'metallic', description: 'Festivo' },
      ],
      blush: [
        { hex: '#D2691E', name: 'Terracota', finish: 'matte', intensity: 'full', description: 'Bronze saudável' },
        { hex: '#CD853F', name: 'Pêssego Bronze', finish: 'shimmer', intensity: 'medium', description: 'Glow dourado' },
        { hex: '#A0522D', name: 'Tijolo Suave', finish: 'matte', intensity: 'medium', description: 'Natural' },
        { hex: '#8B4513', name: 'Marrom Rosado', finish: 'satin', intensity: 'medium', description: 'Terroso' },
      ],
      contour: [
        { hex: '#8B4513', name: 'Marrom Quente', finish: 'matte', description: 'Esculpe com calor' },
        { hex: '#A0522D', name: 'Sienna Intenso', finish: 'matte', description: 'Definição forte' },
      ],
      highlighter: [
        { hex: '#D4AF37', name: 'Ouro', finish: 'metallic', description: 'Luxo máximo' },
        { hex: '#B87333', name: 'Cobre', finish: 'shimmer', description: 'Calor intenso' },
        { hex: '#CD853F', name: 'Bronze', finish: 'shimmer', description: 'Terroso' },
      ],
      nails: [
        { hex: '#D2691E', name: 'Terracota', finish: 'cream', description: 'Clássico outonal' },
        { hex: '#8B4513', name: 'Chocolate', finish: 'cream', description: 'Elegante' },
        { hex: '#228B22', name: 'Verde Floresta', finish: 'cream', description: 'Sofisticado' },
        { hex: '#B87333', name: 'Cobre', finish: 'metallic', description: 'Glamour' },
        { hex: '#800000', name: 'Bordô', finish: 'cream', description: 'Intenso' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF69B4', name: 'Rosa Frio', description: 'Conflita com seu calor' },
        { hex: '#C71585', name: 'Framboesa', description: 'Subtom frio' },
        { hex: '#9370DB', name: 'Lilás', description: 'Muito frio' },
      ],
      eyeshadow: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Frio demais' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Conflita' },
        { hex: '#ADD8E6', name: 'Azul Claro', description: 'Muito frio' },
      ],
      eyeliner: [
        { hex: '#000080', name: 'Azul Marinho', description: 'Prefira verde ou marrom' },
      ],
      blush: [
        { hex: '#FFC0CB', name: 'Rosa Bebê', description: 'Muito frio' },
        { hex: '#DDA0DD', name: 'Malva', description: 'Conflita com calor' },
      ],
      contour: [
        { hex: '#808080', name: 'Cinza', description: 'Esfria a pele' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Conflita' },
      ],
      nails: [
        { hex: '#FF69B4', name: 'Pink Frio', description: 'Desarmônico' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Muito frio' },
      ],
    },
  },

  // AUTUMN DEEP - Outono Profundo
  {
    seasonId: 'autumn-deep',
    seasonName: 'Outono',
    seasonSubtype: 'Profundo',
    recommended: {
      lips: [
        { hex: '#800020', name: 'Borgonha', finish: 'matte', intensity: 'full', description: 'Seu tom statement' },
        { hex: '#8B0A50', name: 'Ameixa', finish: 'matte', intensity: 'full', description: 'Dramático' },
        { hex: '#8B4513', name: 'Marrom Escuro', finish: 'cream', intensity: 'full', description: 'Sofisticado' },
        { hex: '#722F37', name: 'Vinho', finish: 'satin', intensity: 'full', description: 'Elegante' },
        { hex: '#4A2C2A', name: 'Chocolate Escuro', finish: 'matte', intensity: 'full', description: 'Intenso' },
        { hex: '#8B0000', name: 'Vermelho Escuro', finish: 'matte', intensity: 'full', description: 'Impactante' },
      ],
      eyeshadow: [
        { hex: '#CD7F32', name: 'Bronze Escuro', finish: 'metallic', intensity: 'full', description: 'Luxuoso' },
        { hex: '#228B22', name: 'Verde Floresta', finish: 'satin', intensity: 'full', description: 'Dramático' },
        { hex: '#4A2C2A', name: 'Marrom Chocolate', finish: 'matte', intensity: 'full', description: 'Profundidade' },
        { hex: '#8B0A50', name: 'Ameixa', finish: 'matte', intensity: 'full', description: 'Intenso' },
        { hex: '#8B4513', name: 'Terracota Escuro', finish: 'matte', intensity: 'full', description: 'Base' },
        { hex: '#B8860B', name: 'Ouro Envelhecido', finish: 'metallic', intensity: 'full', description: 'Destaque' },
      ],
      eyeliner: [
        { hex: '#4A2C2A', name: 'Chocolate Escuro', finish: 'matte', description: 'Intenso' },
        { hex: '#228B22', name: 'Verde Profundo', finish: 'matte', description: 'Dramático' },
        { hex: '#800020', name: 'Borgonha', finish: 'matte', description: 'Sofisticado' },
        { hex: '#B8860B', name: 'Ouro', finish: 'metallic', description: 'Luxuoso' },
      ],
      blush: [
        { hex: '#CC4E4E', name: 'Terracota', finish: 'matte', intensity: 'full', description: 'Bronze intenso' },
        { hex: '#8B4513', name: 'Tijolo', finish: 'matte', intensity: 'full', description: 'Profundo' },
        { hex: '#CD853F', name: 'Bronze', finish: 'shimmer', intensity: 'medium', description: 'Glow' },
        { hex: '#A0522D', name: 'Sienna', finish: 'matte', intensity: 'medium', description: 'Natural' },
      ],
      contour: [
        { hex: '#4A2C2A', name: 'Marrom Escuro', finish: 'matte', description: 'Esculpe com intensidade' },
        { hex: '#8B4513', name: 'Chocolate', finish: 'matte', description: 'Definição' },
      ],
      highlighter: [
        { hex: '#B8860B', name: 'Ouro Envelhecido', finish: 'metallic', description: 'Luxuoso' },
        { hex: '#CD7F32', name: 'Bronze', finish: 'shimmer', description: 'Intenso' },
        { hex: '#8B4513', name: 'Cobre Escuro', finish: 'shimmer', description: 'Profundo' },
      ],
      nails: [
        { hex: '#800020', name: 'Borgonha', finish: 'cream', description: 'Clássico' },
        { hex: '#4A2C2A', name: 'Chocolate', finish: 'cream', description: 'Elegante' },
        { hex: '#228B22', name: 'Verde Escuro', finish: 'cream', description: 'Sofisticado' },
        { hex: '#8B0A50', name: 'Ameixa', finish: 'cream', description: 'Dramático' },
        { hex: '#B8860B', name: 'Ouro', finish: 'metallic', description: 'Luxuoso' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FFB6C1', name: 'Rosa Claro', description: 'Muito claro' },
        { hex: '#FFDAB9', name: 'Pêssego Claro', description: 'Sem profundidade' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Muito frio' },
      ],
      eyeshadow: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#FFB6C1', name: 'Rosa Claro', description: 'Sem intensidade' },
        { hex: '#ADD8E6', name: 'Azul Claro', description: 'Muito claro e frio' },
      ],
      eyeliner: [
        { hex: '#808080', name: 'Cinza Médio', description: 'Sem intensidade' },
      ],
      blush: [
        { hex: '#FFB6C1', name: 'Rosa Bebê', description: 'Muito claro' },
        { hex: '#FFC0CB', name: 'Rosa Frio', description: 'Sem profundidade' },
      ],
      contour: [
        { hex: '#A9A9A9', name: 'Cinza', description: 'Frio e sem intensidade' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito frio' },
        { hex: '#FFFAF0', name: 'Branco', description: 'Sem cor' },
      ],
      nails: [
        { hex: '#FFB6C1', name: 'Rosa Claro', description: 'Sem intensidade' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Muito frio' },
      ],
    },
  },

  // WINTER DEEP - Inverno Profundo
  {
    seasonId: 'winter-deep',
    seasonName: 'Inverno',
    seasonSubtype: 'Profundo',
    recommended: {
      lips: [
        { hex: '#8B0000', name: 'Vermelho Escuro', finish: 'matte', intensity: 'full', description: 'Dramático' },
        { hex: '#4B0082', name: 'Roxo Profundo', finish: 'matte', intensity: 'full', description: 'Intenso' },
        { hex: '#800020', name: 'Borgonha', finish: 'satin', intensity: 'full', description: 'Sofisticado' },
        { hex: '#8B0A50', name: 'Ameixa Escura', finish: 'matte', intensity: 'full', description: 'Elegante' },
        { hex: '#4A0404', name: 'Vinho Escuro', finish: 'matte', intensity: 'full', description: 'Statement' },
        { hex: '#36013F', name: 'Roxo Noite', finish: 'matte', intensity: 'full', description: 'Misterioso' },
      ],
      eyeshadow: [
        { hex: '#000000', name: 'Preto', finish: 'matte', intensity: 'full', description: 'Definição máxima' },
        { hex: '#4B0082', name: 'Índigo', finish: 'shimmer', intensity: 'full', description: 'Dramático' },
        { hex: '#191970', name: 'Azul Meia-noite', finish: 'satin', intensity: 'full', description: 'Profundo' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', intensity: 'full', description: 'Contraste' },
        { hex: '#8B0A50', name: 'Ameixa', finish: 'matte', intensity: 'full', description: 'Intenso' },
        { hex: '#228B22', name: 'Esmeralda Escura', finish: 'satin', intensity: 'full', description: 'Luxuoso' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Intenso', finish: 'matte', description: 'Clássico' },
        { hex: '#191970', name: 'Azul Escuro', finish: 'matte', description: 'Sofisticado' },
        { hex: '#4B0082', name: 'Roxo Escuro', finish: 'matte', description: 'Dramático' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Festivo' },
      ],
      blush: [
        { hex: '#C71585', name: 'Magenta Escuro', finish: 'matte', intensity: 'full', description: 'Dramático' },
        { hex: '#8B0A50', name: 'Ameixa', finish: 'satin', intensity: 'full', description: 'Intenso' },
        { hex: '#800020', name: 'Berry Profundo', finish: 'matte', intensity: 'full', description: 'Sofisticado' },
        { hex: '#722F37', name: 'Vinho', finish: 'cream', intensity: 'medium', description: 'Elegante' },
      ],
      contour: [
        { hex: '#4A2C2A', name: 'Marrom Frio', finish: 'matte', description: 'Esculpe com intensidade' },
        { hex: '#696969', name: 'Cinza Profundo', finish: 'matte', description: 'Definição dramática' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Contraste máximo' },
        { hex: '#E6E6FA', name: 'Lilás', finish: 'shimmer', description: 'Frio e luminoso' },
        { hex: '#FFFAFA', name: 'Ice', finish: 'shimmer', description: 'Gelado' },
      ],
      nails: [
        { hex: '#8B0000', name: 'Vermelho Escuro', finish: 'cream', description: 'Clássico' },
        { hex: '#4B0082', name: 'Roxo Profundo', finish: 'cream', description: 'Dramático' },
        { hex: '#000000', name: 'Preto', finish: 'cream', description: 'Statement' },
        { hex: '#191970', name: 'Azul Escuro', finish: 'cream', description: 'Sofisticado' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF7F50', name: 'Coral', description: 'Muito quente' },
        { hex: '#FFDAB9', name: 'Pêssego', description: 'Sem intensidade' },
        { hex: '#FFD700', name: 'Dourado', description: 'Calor demais' },
      ],
      eyeshadow: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#B87333', name: 'Cobre', description: 'Calor excessivo' },
        { hex: '#DEB887', name: 'Camurça', description: 'Muito suave' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Prefira preto ou azul' },
      ],
      blush: [
        { hex: '#FFCBA4', name: 'Pêssego', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor demais' },
      ],
      contour: [
        { hex: '#D2691E', name: 'Bronze Quente', description: 'Muito quente' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#B87333', name: 'Cobre', description: 'Conflita' },
      ],
      nails: [
        { hex: '#FF7F50', name: 'Coral', description: 'Muito quente' },
        { hex: '#FFDAB9', name: 'Nude Quente', description: 'Sem profundidade' },
      ],
    },
  },

  // WINTER COOL - Inverno Frio (True Winter)
  {
    seasonId: 'winter-cool',
    seasonName: 'Inverno',
    seasonSubtype: 'Frio',
    recommended: {
      lips: [
        { hex: '#FF0000', name: 'Vermelho Puro', finish: 'matte', intensity: 'full', description: 'Icônico' },
        { hex: '#C71585', name: 'Magenta', finish: 'matte', intensity: 'full', description: 'Vibrante' },
        { hex: '#FF1493', name: 'Pink Intenso', finish: 'satin', intensity: 'full', description: 'Impactante' },
        { hex: '#8B008B', name: 'Roxo', finish: 'matte', intensity: 'full', description: 'Dramático' },
        { hex: '#DC143C', name: 'Crimson', finish: 'satin', intensity: 'full', description: 'Clássico' },
        { hex: '#800080', name: 'Púrpura', finish: 'cream', intensity: 'full', description: 'Statement' },
      ],
      eyeshadow: [
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', intensity: 'full', description: 'Seu metal' },
        { hex: '#4169E1', name: 'Azul Royal', finish: 'shimmer', intensity: 'full', description: 'Vibrante' },
        { hex: '#9400D3', name: 'Violeta', finish: 'shimmer', intensity: 'full', description: 'Dramático' },
        { hex: '#000000', name: 'Preto', finish: 'matte', intensity: 'full', description: 'Definição' },
        { hex: '#50C878', name: 'Esmeralda', finish: 'satin', intensity: 'full', description: 'Luxuoso' },
        { hex: '#FFFFFF', name: 'Branco', finish: 'shimmer', intensity: 'medium', description: 'Iluminador' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto', finish: 'matte', description: 'Definição máxima' },
        { hex: '#4169E1', name: 'Azul Royal', finish: 'matte', description: 'Vibrante' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
        { hex: '#9400D3', name: 'Violeta', finish: 'matte', description: 'Criativo' },
      ],
      blush: [
        { hex: '#FF1493', name: 'Pink Vibrante', finish: 'matte', intensity: 'full', description: 'Impacto' },
        { hex: '#C71585', name: 'Magenta', finish: 'satin', intensity: 'full', description: 'Dramático' },
        { hex: '#DC143C', name: 'Berry Frio', finish: 'cream', intensity: 'medium', description: 'Elegante' },
        { hex: '#DB7093', name: 'Rosa Frio', finish: 'matte', intensity: 'medium', description: 'Sofisticado' },
      ],
      contour: [
        { hex: '#696969', name: 'Cinza Frio', finish: 'matte', description: 'Esculpe friamente' },
        { hex: '#808080', name: 'Cinza Médio', finish: 'matte', description: 'Definição' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Brilho frio' },
        { hex: '#E6E6FA', name: 'Lavanda', finish: 'shimmer', description: 'Etéreo' },
        { hex: '#FFFAFA', name: 'Ice', finish: 'shimmer', description: 'Gelado' },
      ],
      nails: [
        { hex: '#FF0000', name: 'Vermelho Puro', finish: 'cream', description: 'Clássico' },
        { hex: '#C71585', name: 'Magenta', finish: 'cream', description: 'Vibrante' },
        { hex: '#4169E1', name: 'Azul Royal', finish: 'cream', description: 'Bold' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
        { hex: '#FFFFFF', name: 'Branco', finish: 'cream', description: 'Statement' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#FF7F50', name: 'Coral', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor excessivo' },
        { hex: '#CD853F', name: 'Caramelo', description: 'Conflita com frescor' },
      ],
      eyeshadow: [
        { hex: '#FFD700', name: 'Dourado', description: 'Muito quente' },
        { hex: '#B87333', name: 'Cobre', description: 'Calor demais' },
        { hex: '#DEB887', name: 'Camurça', description: 'Quente e apagado' },
      ],
      eyeliner: [
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Prefira preto ou azul' },
      ],
      blush: [
        { hex: '#FF7F50', name: 'Coral Quente', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor demais' },
      ],
      contour: [
        { hex: '#D2691E', name: 'Bronze', description: 'Muito quente' },
      ],
      highlighter: [
        { hex: '#FFD700', name: 'Dourado', description: 'Conflita com frescor' },
        { hex: '#B87333', name: 'Cobre', description: 'Muito quente' },
      ],
      nails: [
        { hex: '#FF7F50', name: 'Coral', description: 'Muito quente' },
        { hex: '#D2691E', name: 'Terracota', description: 'Calor excessivo' },
      ],
    },
  },

  // WINTER BRIGHT - Inverno Brilhante
  {
    seasonId: 'winter-bright',
    seasonName: 'Inverno',
    seasonSubtype: 'Brilhante',
    recommended: {
      lips: [
        { hex: '#FF0000', name: 'Vermelho Vivo', finish: 'matte', intensity: 'full', description: 'Statement máximo' },
        { hex: '#FF1493', name: 'Pink Elétrico', finish: 'satin', intensity: 'full', description: 'Impactante' },
        { hex: '#FF00FF', name: 'Fúcsia', finish: 'matte', intensity: 'full', description: 'Vibrante' },
        { hex: '#DC143C', name: 'Vermelho Blue-Based', finish: 'satin', intensity: 'full', description: 'Clássico' },
        { hex: '#FF69B4', name: 'Pink Vibrante', finish: 'gloss', intensity: 'full', description: 'Divertido' },
        { hex: '#8B008B', name: 'Roxo Intenso', finish: 'matte', intensity: 'full', description: 'Dramático' },
      ],
      eyeshadow: [
        { hex: '#00CED1', name: 'Turquesa', finish: 'shimmer', intensity: 'full', description: 'Vibrante' },
        { hex: '#9400D3', name: 'Violeta Elétrico', finish: 'shimmer', intensity: 'full', description: 'Dramático' },
        { hex: '#C0C0C0', name: 'Prata Brilhante', finish: 'metallic', intensity: 'full', description: 'Impacto' },
        { hex: '#4169E1', name: 'Azul Royal', finish: 'shimmer', intensity: 'full', description: 'Intenso' },
        { hex: '#50C878', name: 'Esmeralda', finish: 'shimmer', intensity: 'full', description: 'Luxuoso' },
        { hex: '#000000', name: 'Preto', finish: 'matte', intensity: 'full', description: 'Contraste' },
      ],
      eyeliner: [
        { hex: '#000000', name: 'Preto Intenso', finish: 'matte', description: 'Definição máxima' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'metallic', description: 'Pop' },
        { hex: '#FF1493', name: 'Pink', finish: 'matte', description: 'Criativo' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
      ],
      blush: [
        { hex: '#FF1493', name: 'Pink Elétrico', finish: 'matte', intensity: 'full', description: 'Máximo impacto' },
        { hex: '#FF00FF', name: 'Fúcsia', finish: 'satin', intensity: 'full', description: 'Vibrante' },
        { hex: '#DC143C', name: 'Berry Vivo', finish: 'cream', intensity: 'full', description: 'Intenso' },
        { hex: '#FF69B4', name: 'Pink Brilhante', finish: 'shimmer', intensity: 'medium', description: 'Glow' },
      ],
      contour: [
        { hex: '#696969', name: 'Cinza Intenso', finish: 'matte', description: 'Definição dramática' },
        { hex: '#808080', name: 'Cinza', finish: 'matte', description: 'Esculpe' },
      ],
      highlighter: [
        { hex: '#C0C0C0', name: 'Prata Brilhante', finish: 'metallic', description: 'Impacto máximo' },
        { hex: '#FF69B4', name: 'Pink Glow', finish: 'shimmer', description: 'Holográfico' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'shimmer', description: 'Criativo' },
      ],
      nails: [
        { hex: '#FF0000', name: 'Vermelho Vivo', finish: 'cream', description: 'Clássico' },
        { hex: '#FF1493', name: 'Pink Elétrico', finish: 'cream', description: 'Statement' },
        { hex: '#00CED1', name: 'Turquesa', finish: 'cream', description: 'Pop' },
        { hex: '#C0C0C0', name: 'Prata', finish: 'metallic', description: 'Moderno' },
        { hex: '#000000', name: 'Preto', finish: 'cream', description: 'Bold' },
      ],
    },
    avoid: {
      lips: [
        { hex: '#BC8F8F', name: 'Rosa Empoeirado', description: 'Muito apagado' },
        { hex: '#D8BFD8', name: 'Malva Suave', description: 'Sem vida' },
        { hex: '#DEB887', name: 'Nude Quente', description: 'Opaco e quente' },
      ],
      eyeshadow: [
        { hex: '#C4B7A6', name: 'Taupe', description: 'Muito apagado' },
        { hex: '#BC8F8F', name: 'Rosa Dusty', description: 'Sem brilho' },
        { hex: '#DEB887', name: 'Camurça', description: 'Quente e opaco' },
      ],
      eyeliner: [
        { hex: '#8B7355', name: 'Marrom Suave', description: 'Sem intensidade' },
      ],
      blush: [
        { hex: '#BC8F8F', name: 'Rosa Dusty', description: 'Muito apagado' },
        { hex: '#C4B7A6', name: 'Nude', description: 'Sem vida' },
      ],
      contour: [
        { hex: '#D2691E', name: 'Bronze Quente', description: 'Muito quente' },
      ],
      highlighter: [
        { hex: '#FFDAB9', name: 'Champagne Quente', description: 'Muito suave e quente' },
      ],
      nails: [
        { hex: '#D8BFD8', name: 'Malva', description: 'Sem brilho' },
        { hex: '#DEB887', name: 'Nude Quente', description: 'Opaco' },
      ],
    },
  },
];

// Helper functions

export function getMakeupForSeason(seasonId: string): SeasonMakeup | undefined {
  return makeupPalettes.find(palette => palette.seasonId === seasonId);
}

export function getRecommendedLips(seasonId: string): MakeupProduct[] {
  const palette = getMakeupForSeason(seasonId);
  return palette?.recommended.lips || [];
}

export function getRecommendedEyeshadow(seasonId: string): MakeupProduct[] {
  const palette = getMakeupForSeason(seasonId);
  return palette?.recommended.eyeshadow || [];
}

export function getRecommendedBlush(seasonId: string): MakeupProduct[] {
  const palette = getMakeupForSeason(seasonId);
  return palette?.recommended.blush || [];
}

export function getAvoidColors(seasonId: string, category: keyof MakeupCategory): MakeupProduct[] {
  const palette = getMakeupForSeason(seasonId);
  return palette?.avoid[category] || [];
}

export function filterByFinish(products: MakeupProduct[], finish: MakeupProduct['finish']): MakeupProduct[] {
  return products.filter(p => p.finish === finish);
}

export function filterByIntensity(products: MakeupProduct[], intensity: MakeupProduct['intensity']): MakeupProduct[] {
  return products.filter(p => p.intensity === intensity);
}
