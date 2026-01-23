// Complete 12-season chromatic system data
// Based on professional color analysis theory (Seasonal Color Analysis)

export interface ColorInfo {
  hex: string;
  name: string;
  description?: string;
}

export interface ColorCombination {
  name: string;
  colors: string[];
  description: string;
}

export interface SeasonData {
  id: string;
  name: string;
  subtype: string;
  mainSeason: 'primavera' | 'verão' | 'outono' | 'inverno';
  description: string;
  shortDescription: string;
  characteristics: {
    temperature: 'warm' | 'cool' | 'neutral-warm' | 'neutral-cool';
    depth: 'light' | 'medium' | 'deep';
    chroma: 'muted' | 'clear' | 'bright' | 'soft';
    contrast: 'low' | 'medium' | 'high';
  };
  keywords: string[];
  colors: {
    primary: ColorInfo[];
    neutrals: ColorInfo[];
    accents: ColorInfo[];
    avoid: ColorInfo[];
  };
  celebrities: string[];
  metals: ('gold' | 'silver' | 'rose-gold' | 'copper' | 'bronze')[];
  jewelry: string[];
  fabrics: string[];
  patterns: string[];
  makeup: {
    lips: string[];
    eyes: string[];
    blush: string[];
    nails: string[];
  };
  bestCombinations: ColorCombination[];
  stylingTips: string[];
  seasonIcon: string;
}

export const chromaticSeasons: SeasonData[] = [
  // SPRING - PRIMAVERA
  {
    id: 'spring-light',
    name: 'Primavera',
    subtype: 'Clara',
    mainSeason: 'primavera',
    description: 'A Primavera Clara tem uma beleza delicada e luminosa, com pele de subtom quente que parece iluminada por dentro. Seus olhos costumam ser claros (azuis, verdes ou castanhos claros) e o cabelo varia de loiro dourado a castanho claro com reflexos dourados.',
    shortDescription: 'Delicada, luminosa e com brilho natural dourado.',
    characteristics: {
      temperature: 'warm',
      depth: 'light',
      chroma: 'clear',
      contrast: 'low',
    },
    keywords: ['luminosa', 'delicada', 'dourada', 'fresca', 'radiante'],
    colors: {
      primary: [
        { hex: '#FFF8DC', name: 'Creme Dourado', description: 'Base perfeita para looks neutros' },
        { hex: '#FFEFD5', name: 'Pêssego Pálido', description: 'Tom que ilumina o rosto' },
        { hex: '#98FB98', name: 'Verde Menta', description: 'Fresco e jovial' },
        { hex: '#87CEEB', name: 'Azul Céu', description: 'Suave e harmonioso' },
        { hex: '#FFB6C1', name: 'Rosa Claro', description: 'Feminino e delicado' },
        { hex: '#F0E68C', name: 'Amarelo Palha', description: 'Quente e alegre' },
      ],
      neutrals: [
        { hex: '#F5F5DC', name: 'Bege Claro' },
        { hex: '#FFE4B5', name: 'Mocassim' },
        { hex: '#DEB887', name: 'Camurça' },
        { hex: '#8B7355', name: 'Marrom Claro' },
      ],
      accents: [
        { hex: '#FF7F50', name: 'Coral' },
        { hex: '#FFD700', name: 'Dourado' },
        { hex: '#40E0D0', name: 'Turquesa Clara' },
        { hex: '#FFA07A', name: 'Salmão' },
      ],
      avoid: [
        { hex: '#000000', name: 'Preto Puro', description: 'Muito pesado para sua leveza' },
        { hex: '#4B0082', name: 'Roxo Escuro', description: 'Apaga sua luminosidade' },
        { hex: '#800000', name: 'Bordô', description: 'Contraste excessivo' },
        { hex: '#2F4F4F', name: 'Cinza Escuro', description: 'Endurece as feições' },
      ],
    },
    celebrities: ['Angélica', 'Claudia Leitte', 'Eliana', 'Taylor Swift', 'Blake Lively'],
    metals: ['gold', 'rose-gold'],
    jewelry: ['Pérolas douradas', 'Turmalinas rosas', 'Citrino', 'Opala'],
    fabrics: ['Seda leve', 'Algodão', 'Linho', 'Cambraia', 'Chiffon'],
    patterns: ['Florais delicados', 'Poás pequenos', 'Listras finas', 'Aquarela'],
    makeup: {
      lips: ['Coral claro', 'Pêssego', 'Rosa quente', 'Nude rosado'],
      eyes: ['Dourado', 'Pêssego', 'Verde-água', 'Marrom claro'],
      blush: ['Pêssego', 'Coral suave', 'Rosa alaranjado'],
      nails: ['Nude rosado', 'Coral', 'Rosa claro', 'Pêssego'],
    },
    bestCombinations: [
      { name: 'Frescor Matinal', colors: ['#87CEEB', '#FFF8DC', '#98FB98'], description: 'Azul céu + creme + verde menta' },
      { name: 'Pôr do Sol', colors: ['#FF7F50', '#FFEFD5', '#FFD700'], description: 'Coral + pêssego + dourado' },
      { name: 'Jardim de Primavera', colors: ['#FFB6C1', '#98FB98', '#F5F5DC'], description: 'Rosa + verde + bege' },
    ],
    stylingTips: [
      'Use branco quebrado ou creme no lugar do branco puro',
      'Evite contrastes muito fortes - opte por transições suaves',
      'Acessórios dourados são seus melhores amigos',
      'Estampas delicadas valorizam mais que as grandes',
    ],
    seasonIcon: '🌸',
  },
  {
    id: 'spring-warm',
    name: 'Primavera',
    subtype: 'Quente',
    mainSeason: 'primavera',
    description: 'A Primavera Quente é vibrante e ensolarada. Sua pele tem um subtom dourado forte, olhos frequentemente em tons de âmbar, castanho dourado ou verde-oliva, e cabelos que vão do ruivo ao castanho avermelhado.',
    shortDescription: 'Vibrante, ensolarada e cheia de calor dourado.',
    characteristics: {
      temperature: 'warm',
      depth: 'medium',
      chroma: 'clear',
      contrast: 'medium',
    },
    keywords: ['ensolarada', 'vibrante', 'quente', 'dourada', 'viva'],
    colors: {
      primary: [
        { hex: '#FF6347', name: 'Tomate', description: 'Energético e vivo' },
        { hex: '#FFA500', name: 'Laranja', description: 'Seu tom statement' },
        { hex: '#FFD700', name: 'Ouro', description: 'Luxo natural' },
        { hex: '#32CD32', name: 'Verde Limão', description: 'Fresco e moderno' },
        { hex: '#FF4500', name: 'Laranja Vermelho', description: 'Impactante' },
        { hex: '#FFDEAD', name: 'Navajo', description: 'Neutro quente perfeito' },
      ],
      neutrals: [
        { hex: '#DEB887', name: 'Camelo' },
        { hex: '#D2691E', name: 'Chocolate' },
        { hex: '#F4A460', name: 'Areia' },
        { hex: '#8B4513', name: 'Sela' },
      ],
      accents: [
        { hex: '#FF8C00', name: 'Laranja Escuro' },
        { hex: '#FF1493', name: 'Rosa Quente' },
        { hex: '#00CED1', name: 'Turquesa' },
        { hex: '#ADFF2F', name: 'Verde Amarelo' },
      ],
      avoid: [
        { hex: '#000000', name: 'Preto', description: 'Drena sua energia' },
        { hex: '#C0C0C0', name: 'Prata', description: 'Conflita com seu calor' },
        { hex: '#4B0082', name: 'Índigo', description: 'Muito frio' },
        { hex: '#708090', name: 'Cinza Ardósia', description: 'Apaga seu brilho' },
      ],
    },
    celebrities: ['Marina Ruy Barbosa', 'Mariana Ximenes', 'Letícia Spiller', 'Jessica Chastain', 'Nicole Kidman'],
    metals: ['gold', 'copper', 'bronze'],
    jewelry: ['Âmbar', 'Citrino', 'Coral', 'Topázio'],
    fabrics: ['Linho', 'Algodão texturizado', 'Seda matte', 'Couro'],
    patterns: ['Étnico', 'Tribal', 'Animal print', 'Geométrico bold'],
    makeup: {
      lips: ['Laranja', 'Terracota', 'Coral vibrante', 'Vermelho tomate'],
      eyes: ['Bronze', 'Cobre', 'Terracota', 'Oliva'],
      blush: ['Terracota', 'Coral intenso', 'Pêssego dourado'],
      nails: ['Laranja', 'Coral', 'Nude alaranjado', 'Terracota'],
    },
    bestCombinations: [
      { name: 'Safari', colors: ['#DEB887', '#32CD32', '#8B4513'], description: 'Camelo + verde + marrom' },
      { name: 'Sunset', colors: ['#FF6347', '#FFA500', '#FFD700'], description: 'Vermelho + laranja + dourado' },
      { name: 'Tropical', colors: ['#00CED1', '#FF8C00', '#FFDEAD'], description: 'Turquesa + laranja + bege' },
    ],
    stylingTips: [
      'Abuse dos tons terrosos e alaranjados',
      'O dourado é seu metal - use sem moderação',
      'Estampas étnicas e tribais são perfeitas para você',
      'Vermelho tomate é mais favorecedor que vermelho azulado',
    ],
    seasonIcon: '☀️',
  },
  {
    id: 'spring-bright',
    name: 'Primavera',
    subtype: 'Brilhante',
    mainSeason: 'primavera',
    description: 'A Primavera Brilhante é a mais vibrante das primaveras. Possui alto contraste natural entre pele, olhos e cabelos, com cores que parecem saturadas e vivas. Olhos brilhantes e cabelos que refletem luz.',
    shortDescription: 'A mais vibrante - cores vivas e alto contraste.',
    characteristics: {
      temperature: 'neutral-warm',
      depth: 'medium',
      chroma: 'bright',
      contrast: 'high',
    },
    keywords: ['brilhante', 'vibrante', 'contrastante', 'viva', 'elétrica'],
    colors: {
      primary: [
        { hex: '#FF1493', name: 'Rosa Choque', description: 'Impactante e moderno' },
        { hex: '#00FF7F', name: 'Verde Spring', description: 'Fresco e vivo' },
        { hex: '#00CED1', name: 'Turquesa Brilhante', description: 'Energético' },
        { hex: '#FFD700', name: 'Amarelo Ouro', description: 'Radiante' },
        { hex: '#FF4500', name: 'Laranja Red', description: 'Statement perfeito' },
        { hex: '#00BFFF', name: 'Azul Céu Intenso', description: 'Vibrante' },
      ],
      neutrals: [
        { hex: '#FFFAF0', name: 'Branco Floral' },
        { hex: '#F5DEB3', name: 'Trigo' },
        { hex: '#D2B48C', name: 'Tan' },
        { hex: '#000000', name: 'Preto' },
      ],
      accents: [
        { hex: '#FF00FF', name: 'Magenta' },
        { hex: '#7FFF00', name: 'Chartreuse' },
        { hex: '#FF6B6B', name: 'Coral Vivo' },
        { hex: '#4169E1', name: 'Azul Royal' },
      ],
      avoid: [
        { hex: '#808080', name: 'Cinza Médio', description: 'Muito neutro' },
        { hex: '#BC8F8F', name: 'Rosado Empoeirado', description: 'Apaga seu brilho' },
        { hex: '#556B2F', name: 'Oliva Escuro', description: 'Muito opaco' },
        { hex: '#D8BFD8', name: 'Malva', description: 'Sem vida suficiente' },
      ],
    },
    celebrities: ['Anitta', 'Taís Araújo', 'IZA', 'Ludmilla', 'Zendaya', 'Lupita Nyong\'o'],
    metals: ['gold', 'rose-gold', 'silver'],
    jewelry: ['Esmeraldas', 'Rubis', 'Safiras', 'Diamantes'],
    fabrics: ['Seda brilhante', 'Cetim', 'Couro verniz', 'Tecidos metalizados'],
    patterns: ['Color blocking', 'Geométrico', 'Pop art', 'Abstrato bold'],
    makeup: {
      lips: ['Fucsia', 'Vermelho vivo', 'Laranja neon', 'Rosa chiclete'],
      eyes: ['Turquesa', 'Dourado', 'Roxo elétrico', 'Verde esmeralda'],
      blush: ['Pink vibrante', 'Coral intenso', 'Pêssego vivo'],
      nails: ['Cores vivas', 'Neon', 'Metalizados', 'Color blocking'],
    },
    bestCombinations: [
      { name: 'Pop Art', colors: ['#FF1493', '#FFD700', '#00BFFF'], description: 'Pink + amarelo + azul' },
      { name: 'Tropical Luxe', colors: ['#00FF7F', '#FF4500', '#FFFAF0'], description: 'Verde + laranja + branco' },
      { name: 'Electric', colors: ['#00CED1', '#FF1493', '#000000'], description: 'Turquesa + pink + preto' },
    ],
    stylingTips: [
      'Você pode usar cores que pareceriam "demais" em outras pessoas',
      'O preto funciona bem para você - use para contrastar',
      'Color blocking é seu território',
      'Evite looks monocromáticos em tons neutros',
    ],
    seasonIcon: '🌺',
  },

  // SUMMER - VERÃO
  {
    id: 'summer-light',
    name: 'Verão',
    subtype: 'Claro',
    mainSeason: 'verão',
    description: 'O Verão Claro tem uma aparência suave e etérea. Pele clara com subtom rosado ou azulado, olhos frequentemente azuis, cinzas ou verdes acinzentados, e cabelos em tons de loiro acinzentado ou castanho claro frio.',
    shortDescription: 'Etérea, suave e com frescor rosado.',
    characteristics: {
      temperature: 'cool',
      depth: 'light',
      chroma: 'soft',
      contrast: 'low',
    },
    keywords: ['etérea', 'suave', 'delicada', 'fresca', 'romântica'],
    colors: {
      primary: [
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Sua cor assinatura' },
        { hex: '#B0C4DE', name: 'Azul Aço Claro', description: 'Elegante e sereno' },
        { hex: '#FFB6C1', name: 'Rosa Bebê', description: 'Delicado e feminino' },
        { hex: '#ADD8E6', name: 'Azul Claro', description: 'Tranquilo' },
        { hex: '#DDA0DD', name: 'Ameixa Clara', description: 'Sofisticado' },
        { hex: '#F0FFF0', name: 'Verde Orvalho', description: 'Fresco e leve' },
      ],
      neutrals: [
        { hex: '#F5F5F5', name: 'Branco Gelo' },
        { hex: '#DCDCDC', name: 'Cinza Claro' },
        { hex: '#C4AEAD', name: 'Rosa Acinzentado' },
        { hex: '#778899', name: 'Cinza Ardósia Claro' },
      ],
      accents: [
        { hex: '#9370DB', name: 'Púrpura Médio' },
        { hex: '#87CEEB', name: 'Azul Céu' },
        { hex: '#FFC0CB', name: 'Rosa' },
        { hex: '#98D8C8', name: 'Menta Suave' },
      ],
      avoid: [
        { hex: '#FF4500', name: 'Laranja', description: 'Muito quente' },
        { hex: '#FFD700', name: 'Amarelo Ouro', description: 'Conflita com seu frescor' },
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Peso excessivo' },
        { hex: '#000000', name: 'Preto Puro', description: 'Contraste demais' },
      ],
    },
    celebrities: ['Grazi Massafera', 'Flávia Alessandra', 'Carolina Dieckmann', 'Elle Fanning', 'Cate Blanchett'],
    metals: ['silver', 'rose-gold'],
    jewelry: ['Pérolas', 'Água-marinha', 'Quartzo rosa', 'Ametista clara'],
    fabrics: ['Seda', 'Chiffon', 'Cashmere', 'Algodão fino', 'Renda'],
    patterns: ['Florais românticos', 'Toile de Jouy', 'Aquarela', 'Tie-dye suave'],
    makeup: {
      lips: ['Rosa frio', 'Malva', 'Berry claro', 'Nude rosado frio'],
      eyes: ['Lavanda', 'Cinza prateado', 'Rosa suave', 'Azul gelo'],
      blush: ['Rosa frio', 'Malva', 'Berry suave'],
      nails: ['Rosa claro', 'Lavanda', 'Nude frio', 'French manicure'],
    },
    bestCombinations: [
      { name: 'Sonho', colors: ['#E6E6FA', '#FFB6C1', '#F5F5F5'], description: 'Lavanda + rosa + branco' },
      { name: 'Serenidade', colors: ['#B0C4DE', '#DDA0DD', '#DCDCDC'], description: 'Azul + ameixa + cinza' },
      { name: 'Fada', colors: ['#ADD8E6', '#F0FFF0', '#FFC0CB'], description: 'Azul claro + verde + rosa' },
    ],
    stylingTips: [
      'Tons pastel são perfeitos para você',
      'Use prata ou ouro branco em vez de ouro amarelo',
      'O branco off-white rosado é melhor que branco puro',
      'Monocromático em tons suaves é muito elegante',
    ],
    seasonIcon: '🌷',
  },
  {
    id: 'summer-soft',
    name: 'Verão',
    subtype: 'Suave',
    mainSeason: 'verão',
    description: 'O Verão Suave tem uma beleza sofisticada e discreta. Suas cores naturais parecem levemente "empoeiradas" ou "fosqueadas". Olhos em tons neutros acinzentados e cabelos castanhos acinzentados ou loiros escuros.',
    shortDescription: 'Sofisticada, discreta e elegantemente neutra.',
    characteristics: {
      temperature: 'neutral-cool',
      depth: 'medium',
      chroma: 'muted',
      contrast: 'low',
    },
    keywords: ['sofisticada', 'elegante', 'discreta', 'suave', 'atemporal'],
    colors: {
      primary: [
        { hex: '#BC8F8F', name: 'Rosa Antigo', description: 'Elegante e versátil' },
        { hex: '#D8BFD8', name: 'Malva', description: 'Sofisticado' },
        { hex: '#B0C4DE', name: 'Azul Aço Suave', description: 'Clássico' },
        { hex: '#C0C0C0', name: 'Prata', description: 'Seu neutro metálico' },
        { hex: '#A9A9A9', name: 'Cinza Elegante', description: 'Base perfeita' },
        { hex: '#CDB7B5', name: 'Rosa Acinzentado', description: 'Tons de pele ideal' },
      ],
      neutrals: [
        { hex: '#E8E4E1', name: 'Greige' },
        { hex: '#C4B7A6', name: 'Taupe' },
        { hex: '#9E9E9E', name: 'Cinza Médio' },
        { hex: '#696969', name: 'Cinza Dim' },
      ],
      accents: [
        { hex: '#8B7D7B', name: 'Castor' },
        { hex: '#9370DB', name: 'Roxo Médio' },
        { hex: '#5F9EA0', name: 'Cadet Blue' },
        { hex: '#CD5C5C', name: 'Rosa Indiano' },
      ],
      avoid: [
        { hex: '#FF0000', name: 'Vermelho Vivo', description: 'Saturação excessiva' },
        { hex: '#00FF00', name: 'Verde Neon', description: 'Muito vibrante' },
        { hex: '#FF8C00', name: 'Laranja Escuro', description: 'Muito quente' },
        { hex: '#000000', name: 'Preto Puro', description: 'Prefira cinza carvão' },
      ],
    },
    celebrities: ['Deborah Secco', 'Giovanna Ewbank', 'Fernanda Paes Leme', 'Jennifer Aniston', 'Kate Middleton'],
    metals: ['silver', 'rose-gold'],
    jewelry: ['Pérolas', 'Diamantes', 'Quartzo fumê', 'Turmalina rosa'],
    fabrics: ['Cashmere', 'Seda matte', 'Lã fina', 'Crepe', 'Tweed'],
    patterns: ['Xadrez suave', 'Herringbone', 'Listras finas', 'Florais apagados'],
    makeup: {
      lips: ['Rosa antigo', 'Malva', 'Nude rosado', 'Berry suave'],
      eyes: ['Taupe', 'Cinza', 'Malva', 'Ameixa suave'],
      blush: ['Rosa dusty', 'Malva', 'Pêssego rosado'],
      nails: ['Nude', 'Greige', 'Rosa antigo', 'Malva'],
    },
    bestCombinations: [
      { name: 'Parisiense', colors: ['#BC8F8F', '#A9A9A9', '#E8E4E1'], description: 'Rosa antigo + cinza + greige' },
      { name: 'Soft Elegance', colors: ['#D8BFD8', '#B0C4DE', '#C0C0C0'], description: 'Malva + azul + prata' },
      { name: 'Minimal Chic', colors: ['#C4B7A6', '#696969', '#CDB7B5'], description: 'Taupe + cinza + rosa' },
    ],
    stylingTips: [
      'Tons "empoeirados" são seus melhores amigos',
      'Monocromático em diferentes tons de cinza é perfeito',
      'Evite cores muito saturadas ou neon',
      'Greige (cinza+bege) é um neutro fantástico para você',
    ],
    seasonIcon: '🌫️',
  },
  {
    id: 'summer-cool',
    name: 'Verão',
    subtype: 'Frio',
    mainSeason: 'verão',
    description: 'O Verão Frio tem cores distintamente frias e pode usar tons mais intensos que os outros verões. Pele com subtom claramente rosado ou azulado, olhos frequentemente azuis ou cinzas, cabelos em tons frios.',
    shortDescription: 'Distintamente fria com capacidade para intensidade.',
    characteristics: {
      temperature: 'cool',
      depth: 'medium',
      chroma: 'clear',
      contrast: 'medium',
    },
    keywords: ['fria', 'elegante', 'refinada', 'sofisticada', 'intensa'],
    colors: {
      primary: [
        { hex: '#4169E1', name: 'Azul Royal', description: 'Poderoso e elegante' },
        { hex: '#9370DB', name: 'Roxo Médio', description: 'Sofisticado' },
        { hex: '#FF69B4', name: 'Rosa Intenso', description: 'Vibrante mas frio' },
        { hex: '#20B2AA', name: 'Turquesa Claro', description: 'Fresco' },
        { hex: '#DB7093', name: 'Rosa Violeta', description: 'Romântico' },
        { hex: '#6A5ACD', name: 'Azul Ardósia', description: 'Misterioso' },
      ],
      neutrals: [
        { hex: '#FFFFFF', name: 'Branco Puro' },
        { hex: '#C0C0C0', name: 'Prata' },
        { hex: '#708090', name: 'Cinza Ardósia' },
        { hex: '#2F4F4F', name: 'Cinza Escuro Frio' },
      ],
      accents: [
        { hex: '#BA55D3', name: 'Orquídea' },
        { hex: '#00CED1', name: 'Turquesa' },
        { hex: '#FF1493', name: 'Rosa Choque Frio' },
        { hex: '#4682B4', name: 'Azul Aço' },
      ],
      avoid: [
        { hex: '#FF8C00', name: 'Laranja', description: 'Muito quente' },
        { hex: '#8B4513', name: 'Marrom Quente', description: 'Conflita com seu frescor' },
        { hex: '#FFD700', name: 'Ouro', description: 'Prefira prata' },
        { hex: '#F0E68C', name: 'Cáqui', description: 'Amarelado demais' },
      ],
    },
    celebrities: ['Adriana Lima', 'Alessandra Ambrosio', 'Fernanda Montenegro', 'Anne Hathaway', 'Keira Knightley'],
    metals: ['silver'],
    jewelry: ['Diamantes', 'Safiras', 'Tanzanita', 'Ametista'],
    fabrics: ['Seda fria', 'Cetim', 'Chiffon', 'Veludo', 'Lã fria'],
    patterns: ['Florais frios', 'Abstrato', 'Geométrico', 'Xadrez azulado'],
    makeup: {
      lips: ['Berry', 'Vinho rosado', 'Fucsia', 'Rosa frio intenso'],
      eyes: ['Roxo', 'Cinza escuro', 'Azul', 'Prata'],
      blush: ['Berry', 'Rosa frio', 'Ameixa suave'],
      nails: ['Vinho', 'Roxo', 'Azul escuro', 'Prata'],
    },
    bestCombinations: [
      { name: 'Realeza', colors: ['#4169E1', '#FFFFFF', '#2F4F4F'], description: 'Azul royal + branco + cinza' },
      { name: 'Berry Garden', colors: ['#9370DB', '#FF69B4', '#C0C0C0'], description: 'Roxo + rosa + prata' },
      { name: 'Ocean', colors: ['#20B2AA', '#6A5ACD', '#708090'], description: 'Turquesa + azul ardósia + cinza' },
    ],
    stylingTips: [
      'Você pode usar cores mais intensas que outros verões',
      'Prata é seu metal - evite ouro amarelo',
      'Branco puro funciona bem para você',
      'Tons de joia (jewel tones) frios são perfeitos',
    ],
    seasonIcon: '❄️',
  },

  // AUTUMN - OUTONO
  {
    id: 'autumn-soft',
    name: 'Outono',
    subtype: 'Suave',
    mainSeason: 'outono',
    description: 'O Outono Suave tem uma beleza terrosa e sofisticada, como uma paisagem de outono em tons suaves. Cores naturais em tons médios, nem muito claros nem muito escuros, com uma qualidade "fosqueada".',
    shortDescription: 'Terrosa, sofisticada e suavemente quente.',
    characteristics: {
      temperature: 'neutral-warm',
      depth: 'medium',
      chroma: 'muted',
      contrast: 'low',
    },
    keywords: ['terrosa', 'sofisticada', 'natural', 'suave', 'orgânica'],
    colors: {
      primary: [
        { hex: '#D2B48C', name: 'Tan', description: 'Base versátil' },
        { hex: '#DEB887', name: 'Camurça', description: 'Elegante e quente' },
        { hex: '#F5DEB3', name: 'Trigo', description: 'Luminoso' },
        { hex: '#BDB76B', name: 'Cáqui Escuro', description: 'Natural' },
        { hex: '#BC8F8F', name: 'Rosa Outonal', description: 'Suave e feminino' },
        { hex: '#8FBC8F', name: 'Verde Mar Escuro', description: 'Equilibrado' },
      ],
      neutrals: [
        { hex: '#E8DCC4', name: 'Creme Quente' },
        { hex: '#C4B7A6', name: 'Greige Quente' },
        { hex: '#8B7D6B', name: 'Marrom Suave' },
        { hex: '#5C4033', name: 'Café' },
      ],
      accents: [
        { hex: '#CD853F', name: 'Peru' },
        { hex: '#B8860B', name: 'Dourado Escuro' },
        { hex: '#6B8E23', name: 'Verde Oliva' },
        { hex: '#9ACD32', name: 'Verde Amarelo' },
      ],
      avoid: [
        { hex: '#FF1493', name: 'Rosa Choque', description: 'Muito frio e vibrante' },
        { hex: '#0000FF', name: 'Azul Puro', description: 'Muito frio' },
        { hex: '#000000', name: 'Preto', description: 'Muito duro' },
        { hex: '#FF00FF', name: 'Magenta', description: 'Muito saturado' },
      ],
    },
    celebrities: ['Juliana Paes', 'Paolla Oliveira', 'Dira Paes', 'Drew Barrymore', 'Julia Roberts'],
    metals: ['gold', 'bronze', 'copper'],
    jewelry: ['Citrino', 'Topázio', 'Jaspe', 'Olho de tigre'],
    fabrics: ['Camurça', 'Tweed', 'Linho', 'Algodão orgânico', 'Lã'],
    patterns: ['Paisley', 'Xadrez terroso', 'Tribal suave', 'Florais outono'],
    makeup: {
      lips: ['Nude quente', 'Terracota suave', 'Pêssego', 'Rosa coral'],
      eyes: ['Bronze suave', 'Marrom', 'Verde oliva', 'Taupe'],
      blush: ['Pêssego', 'Coral suave', 'Bronze'],
      nails: ['Nude caramelo', 'Terracota', 'Verde musgo', 'Marrom'],
    },
    bestCombinations: [
      { name: 'Safari Chic', colors: ['#D2B48C', '#8FBC8F', '#8B7D6B'], description: 'Tan + verde + marrom' },
      { name: 'Harvest', colors: ['#DEB887', '#CD853F', '#F5DEB3'], description: 'Camurça + peru + trigo' },
      { name: 'Organic', colors: ['#BDB76B', '#BC8F8F', '#C4B7A6'], description: 'Cáqui + rosa + greige' },
    ],
    stylingTips: [
      'Tons terrosos são sua zona de conforto',
      'Camadas em diferentes tons neutros funcionam bem',
      'Prefira ouro com acabamento fosco',
      'Evite cores muito vibrantes ou frias',
    ],
    seasonIcon: '🍂',
  },
  {
    id: 'autumn-warm',
    name: 'Outono',
    subtype: 'Quente',
    mainSeason: 'outono',
    description: 'O Outono Quente é como folhas de outono em seu ápice - rico, saturado e dourado. Pele com forte subtom dourado ou pêssego, cabelos frequentemente ruivos ou castanhos avermelhados, olhos em tons quentes.',
    shortDescription: 'Rico, saturado e gloriosamente dourado.',
    characteristics: {
      temperature: 'warm',
      depth: 'medium',
      chroma: 'clear',
      contrast: 'medium',
    },
    keywords: ['rica', 'saturada', 'dourada', 'terrosa', 'intensa'],
    colors: {
      primary: [
        { hex: '#CD853F', name: 'Peru', description: 'Cor âncora' },
        { hex: '#B8860B', name: 'Dourado Escuro', description: 'Luxuoso' },
        { hex: '#8B4513', name: 'Chocolate', description: 'Sofisticado' },
        { hex: '#DAA520', name: 'Âmbar', description: 'Radiante' },
        { hex: '#556B2F', name: 'Verde Oliva Escuro', description: 'Elegante' },
        { hex: '#A0522D', name: 'Sienna', description: 'Terroso' },
      ],
      neutrals: [
        { hex: '#F5F5DC', name: 'Bege' },
        { hex: '#D2691E', name: 'Chocolate Médio' },
        { hex: '#8B7355', name: 'Marrom Médio' },
        { hex: '#3D2B1F', name: 'Café Escuro' },
      ],
      accents: [
        { hex: '#FF6347', name: 'Tomate' },
        { hex: '#228B22', name: 'Verde Floresta' },
        { hex: '#FF8C00', name: 'Laranja Escuro' },
        { hex: '#B22222', name: 'Tijolo' },
      ],
      avoid: [
        { hex: '#C0C0C0', name: 'Prata', description: 'Muito fria' },
        { hex: '#4169E1', name: 'Azul Royal', description: 'Conflita com seu calor' },
        { hex: '#FF69B4', name: 'Rosa Frio', description: 'Subtom errado' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Muito fria e clara' },
      ],
    },
    celebrities: ['Sabrina Sato', 'Camila Pitanga', 'Lucy Alves', 'Emma Stone', 'Julianne Moore'],
    metals: ['gold', 'bronze', 'copper'],
    jewelry: ['Âmbar', 'Coral', 'Carnelian', 'Jade verde'],
    fabrics: ['Veludo', 'Couro', 'Camurça', 'Tweed', 'Lã grossa'],
    patterns: ['Animal print', 'Tartan', 'Étnico rico', 'Paisley bold'],
    makeup: {
      lips: ['Terracota', 'Tijolo', 'Laranja', 'Marrom avermelhado'],
      eyes: ['Bronze', 'Cobre', 'Marrom quente', 'Verde musgo'],
      blush: ['Terracota', 'Bronze', 'Pêssego escuro'],
      nails: ['Terracota', 'Marrom chocolate', 'Verde escuro', 'Bronze'],
    },
    bestCombinations: [
      { name: 'Outono Clássico', colors: ['#CD853F', '#8B4513', '#DAA520'], description: 'Peru + chocolate + âmbar' },
      { name: 'Terra Rica', colors: ['#556B2F', '#B8860B', '#A0522D'], description: 'Oliva + dourado + sienna' },
      { name: 'Floresta', colors: ['#228B22', '#D2691E', '#F5F5DC'], description: 'Verde floresta + chocolate + bege' },
    ],
    stylingTips: [
      'Cores ricas e saturadas são seu território',
      'Ouro amarelo intenso é perfeito para você',
      'Tecidos com textura valorizam seus looks',
      'Não tenha medo de combinações terrosas ousadas',
    ],
    seasonIcon: '🍁',
  },
  {
    id: 'autumn-deep',
    name: 'Outono',
    subtype: 'Profundo',
    mainSeason: 'outono',
    description: 'O Outono Profundo tem uma beleza dramática e intensa. Cores naturais em tons profundos com calor sutil. Alto contraste entre olhos escuros, cabelos escuros e pele que pode variar de clara a escura.',
    shortDescription: 'Dramática, intensa e profundamente rica.',
    characteristics: {
      temperature: 'neutral-warm',
      depth: 'deep',
      chroma: 'muted',
      contrast: 'high',
    },
    keywords: ['dramática', 'intensa', 'profunda', 'rica', 'misteriosa'],
    colors: {
      primary: [
        { hex: '#8B0000', name: 'Vermelho Escuro', description: 'Dramático' },
        { hex: '#A0522D', name: 'Sienna', description: 'Sofisticado' },
        { hex: '#556B2F', name: 'Verde Oliva Escuro', description: 'Misterioso' },
        { hex: '#2F4F4F', name: 'Cinza Ardósia Escuro', description: 'Elegante' },
        { hex: '#8B4513', name: 'Marrom Sela', description: 'Base rica' },
        { hex: '#191970', name: 'Azul Meia-noite', description: 'Profundo' },
      ],
      neutrals: [
        { hex: '#F5F5DC', name: 'Marfim' },
        { hex: '#5C4033', name: 'Café' },
        { hex: '#3D2B1F', name: 'Bistre' },
        { hex: '#000000', name: 'Preto' },
      ],
      accents: [
        { hex: '#800020', name: 'Borgonha' },
        { hex: '#006400', name: 'Verde Escuro' },
        { hex: '#4B0082', name: 'Índigo Quente' },
        { hex: '#B8860B', name: 'Ouro Velho' },
      ],
      avoid: [
        { hex: '#FFB6C1', name: 'Rosa Claro', description: 'Muito suave' },
        { hex: '#E6E6FA', name: 'Lavanda', description: 'Muito clara e fria' },
        { hex: '#87CEEB', name: 'Azul Céu', description: 'Muito claro' },
        { hex: '#98FB98', name: 'Verde Menta', description: 'Muito claro' },
      ],
    },
    celebrities: ['Juliana Alves', 'Cris Vianna', 'Preta Gil', 'Jennifer Lopez', 'Sofia Vergara'],
    metals: ['gold', 'bronze'],
    jewelry: ['Ônix', 'Olho de tigre', 'Granadas', 'Esmeraldas escuras'],
    fabrics: ['Veludo', 'Couro', 'Seda pesada', 'Brocado', 'Lã'],
    patterns: ['Animal print bold', 'Paisley escuro', 'Barroco', 'Étnico escuro'],
    makeup: {
      lips: ['Borgonha', 'Ameixa', 'Marrom escuro', 'Vermelho escuro'],
      eyes: ['Bronze escuro', 'Verde floresta', 'Marrom chocolate', 'Dourado escuro'],
      blush: ['Bronze', 'Terracota escuro', 'Ameixa suave'],
      nails: ['Borgonha', 'Chocolate escuro', 'Verde floresta', 'Preto'],
    },
    bestCombinations: [
      { name: 'Drama', colors: ['#8B0000', '#000000', '#B8860B'], description: 'Vermelho escuro + preto + ouro' },
      { name: 'Mistério', colors: ['#556B2F', '#2F4F4F', '#5C4033'], description: 'Oliva + cinza + café' },
      { name: 'Noite Rica', colors: ['#191970', '#800020', '#F5F5DC'], description: 'Azul noite + borgonha + marfim' },
    ],
    stylingTips: [
      'Você pode usar preto com sucesso',
      'Cores profundas e escuras são suas aliadas',
      'Ouro antigo e bronze são melhores que ouro brilhante',
      'Contraste alto funciona bem - não tema o drama',
    ],
    seasonIcon: '🌰',
  },

  // WINTER - INVERNO
  {
    id: 'winter-cool',
    name: 'Inverno',
    subtype: 'Frio',
    mainSeason: 'inverno',
    description: 'O Inverno Frio tem uma beleza gelada e sofisticada. Cores naturais distintamente frias, com pele de subtom rosado ou azulado, olhos frequentemente em tons frios intensos, e cabelos em tons de preto azulado ou castanho frio.',
    shortDescription: 'Gelada, sofisticada e elegantemente fria.',
    characteristics: {
      temperature: 'cool',
      depth: 'medium',
      chroma: 'clear',
      contrast: 'high',
    },
    keywords: ['gelada', 'sofisticada', 'fria', 'elegante', 'refinada'],
    colors: {
      primary: [
        { hex: '#000080', name: 'Marinho', description: 'Clássico e elegante' },
        { hex: '#DC143C', name: 'Carmesim', description: 'Dramático' },
        { hex: '#4B0082', name: 'Índigo', description: 'Profundo' },
        { hex: '#008B8B', name: 'Teal Escuro', description: 'Sofisticado' },
        { hex: '#FF1493', name: 'Rosa Choque', description: 'Impactante' },
        { hex: '#FFFFFF', name: 'Branco Puro', description: 'Seu neutro ideal' },
      ],
      neutrals: [
        { hex: '#FFFFFF', name: 'Branco Puro' },
        { hex: '#C0C0C0', name: 'Prata' },
        { hex: '#696969', name: 'Cinza' },
        { hex: '#000000', name: 'Preto' },
      ],
      accents: [
        { hex: '#9400D3', name: 'Violeta' },
        { hex: '#00CED1', name: 'Turquesa Fria' },
        { hex: '#FF0080', name: 'Magenta Frio' },
        { hex: '#4169E1', name: 'Azul Royal' },
      ],
      avoid: [
        { hex: '#FF8C00', name: 'Laranja', description: 'Muito quente' },
        { hex: '#DAA520', name: 'Dourado', description: 'Conflita com seu frescor' },
        { hex: '#8B4513', name: 'Marrom', description: 'Muito quente' },
        { hex: '#F0E68C', name: 'Cáqui', description: 'Amarelado' },
      ],
    },
    celebrities: ['Malu Mader', 'Glória Pires', 'Christiane Torloni', 'Angelina Jolie', 'Liv Tyler'],
    metals: ['silver'],
    jewelry: ['Diamantes', 'Safiras', 'Rubis', 'Ametistas'],
    fabrics: ['Seda', 'Cetim', 'Veludo', 'Couro preto', 'Cashmere'],
    patterns: ['Geométrico', 'Color blocking', 'Xadrez P&B', 'Abstrato bold'],
    makeup: {
      lips: ['Vermelho frio', 'Berry', 'Vinho', 'Fucsia'],
      eyes: ['Cinza escuro', 'Roxo', 'Prata', 'Azul'],
      blush: ['Berry', 'Rosa frio', 'Ameixa'],
      nails: ['Vermelho escuro', 'Preto', 'Cinza metálico', 'Roxo'],
    },
    bestCombinations: [
      { name: 'Clássico Frio', colors: ['#000080', '#FFFFFF', '#DC143C'], description: 'Marinho + branco + vermelho' },
      { name: 'Drama Frio', colors: ['#4B0082', '#C0C0C0', '#000000'], description: 'Índigo + prata + preto' },
      { name: 'Elegância Gelada', colors: ['#008B8B', '#FFFFFF', '#696969'], description: 'Teal + branco + cinza' },
    ],
    stylingTips: [
      'Preto e branco são seus neutros perfeitos',
      'Prata é seu metal - evite ouro',
      'Cores de joia frias são ideais',
      'Alto contraste favorece você',
    ],
    seasonIcon: '❄️',
  },
  {
    id: 'winter-deep',
    name: 'Inverno',
    subtype: 'Profundo',
    mainSeason: 'inverno',
    description: 'O Inverno Profundo tem uma beleza rica e dramática. Cores naturais muito escuras e intensas, com olhos escuros, cabelos muito escuros (frequentemente preto) e pele que pode variar mas sempre com profundidade.',
    shortDescription: 'Rica, dramática e intensamente profunda.',
    characteristics: {
      temperature: 'neutral-cool',
      depth: 'deep',
      chroma: 'clear',
      contrast: 'high',
    },
    keywords: ['rica', 'dramática', 'profunda', 'intensa', 'poderosa'],
    colors: {
      primary: [
        { hex: '#191970', name: 'Azul Meia-noite', description: 'Profundo' },
        { hex: '#800000', name: 'Marrom Bordô', description: 'Intenso' },
        { hex: '#006400', name: 'Verde Escuro', description: 'Elegante' },
        { hex: '#2F4F4F', name: 'Cinza Ardósia', description: 'Sofisticado' },
        { hex: '#800020', name: 'Borgonha', description: 'Dramático' },
        { hex: '#4B0082', name: 'Índigo Profundo', description: 'Misterioso' },
      ],
      neutrals: [
        { hex: '#FFFAFA', name: 'Branco Neve' },
        { hex: '#808080', name: 'Cinza' },
        { hex: '#2F2F2F', name: 'Carvão' },
        { hex: '#000000', name: 'Preto' },
      ],
      accents: [
        { hex: '#8B0000', name: 'Vermelho Escuro' },
        { hex: '#008080', name: 'Teal' },
        { hex: '#483D8B', name: 'Azul Ardósia Escuro' },
        { hex: '#228B22', name: 'Verde Floresta' },
      ],
      avoid: [
        { hex: '#FFDAB9', name: 'Pêssego', description: 'Muito claro e quente' },
        { hex: '#FFE4B5', name: 'Mocassim', description: 'Muito suave' },
        { hex: '#F0E68C', name: 'Cáqui', description: 'Muito amarelado' },
        { hex: '#DDA0DD', name: 'Ameixa Clara', description: 'Muito suave' },
      ],
    },
    celebrities: ['Sheron Menezzes', 'Erika Januza', 'Liniker', 'Beyoncé', 'Naomi Campbell'],
    metals: ['silver', 'gold'],
    jewelry: ['Ônix', 'Esmeraldas', 'Rubis escuros', 'Safiras'],
    fabrics: ['Veludo', 'Seda pesada', 'Couro', 'Brocado', 'Lã'],
    patterns: ['Barroco', 'Animal print bold', 'Geométrico', 'Floral dark'],
    makeup: {
      lips: ['Vermelho escuro', 'Borgonha', 'Ameixa', 'Nude escuro'],
      eyes: ['Preto', 'Carvão', 'Verde escuro', 'Bronze escuro'],
      blush: ['Bronze', 'Berry escuro', 'Ameixa'],
      nails: ['Preto', 'Borgonha', 'Verde escuro', 'Azul noite'],
    },
    bestCombinations: [
      { name: 'Noir', colors: ['#000000', '#800020', '#FFFAFA'], description: 'Preto + borgonha + branco' },
      { name: 'Floresta Noturna', colors: ['#006400', '#191970', '#2F2F2F'], description: 'Verde + azul noite + carvão' },
      { name: 'Poder', colors: ['#800000', '#4B0082', '#808080'], description: 'Bordô + índigo + cinza' },
    ],
    stylingTips: [
      'Preto é seu melhor amigo - use sem medo',
      'Cores profundas e saturadas são perfeitas',
      'Pode misturar prata e ouro com moderação',
      'Evite cores pastel ou muito suaves',
    ],
    seasonIcon: '🌑',
  },
  {
    id: 'winter-bright',
    name: 'Inverno',
    subtype: 'Brilhante',
    mainSeason: 'inverno',
    description: 'O Inverno Brilhante é o mais vibrante dos invernos. Cores naturais com alto contraste e brilho intenso. Olhos brilhantes e vivos, cabelos frequentemente muito escuros, e pele com clareza.',
    shortDescription: 'Vibrante, contrastante e intensamente brilhante.',
    characteristics: {
      temperature: 'neutral-cool',
      depth: 'medium',
      chroma: 'bright',
      contrast: 'high',
    },
    keywords: ['vibrante', 'brilhante', 'contrastante', 'elétrica', 'impactante'],
    colors: {
      primary: [
        { hex: '#FF0000', name: 'Vermelho Puro', description: 'Statement absoluto' },
        { hex: '#0000FF', name: 'Azul Puro', description: 'Vibrante' },
        { hex: '#FF00FF', name: 'Magenta', description: 'Elétrico' },
        { hex: '#00FFFF', name: 'Ciano', description: 'Impactante' },
        { hex: '#FFFF00', name: 'Amarelo Limão', description: 'Ousado' },
        { hex: '#00FF00', name: 'Verde Limão', description: 'Energético' },
      ],
      neutrals: [
        { hex: '#FFFFFF', name: 'Branco Puro' },
        { hex: '#C0C0C0', name: 'Prata' },
        { hex: '#808080', name: 'Cinza' },
        { hex: '#000000', name: 'Preto' },
      ],
      accents: [
        { hex: '#FF1493', name: 'Rosa Choque' },
        { hex: '#4169E1', name: 'Azul Royal' },
        { hex: '#32CD32', name: 'Verde Lima' },
        { hex: '#9400D3', name: 'Violeta Escuro' },
      ],
      avoid: [
        { hex: '#DEB887', name: 'Camurça', description: 'Muito muted' },
        { hex: '#D8BFD8', name: 'Malva', description: 'Sem intensidade' },
        { hex: '#F5DEB3', name: 'Trigo', description: 'Muito suave' },
        { hex: '#BC8F8F', name: 'Rosa Empoeirado', description: 'Muito muted' },
      ],
    },
    celebrities: ['Bruna Marquezine', 'Isis Valverde', 'Mel Maia', 'Megan Fox', 'Kim Kardashian'],
    metals: ['silver'],
    jewelry: ['Diamantes', 'Esmeraldas vivas', 'Safiras azuis', 'Rubis'],
    fabrics: ['Cetim', 'Seda brilhante', 'Couro verniz', 'Sequins'],
    patterns: ['Color blocking', 'Pop art', 'Geométrico bold', 'Abstract'],
    makeup: {
      lips: ['Vermelho vivo', 'Fucsia', 'Pink', 'Roxo elétrico'],
      eyes: ['Preto', 'Azul elétrico', 'Prata', 'Verde vivo'],
      blush: ['Pink vibrante', 'Coral intenso', 'Berry'],
      nails: ['Vermelho', 'Preto', 'Cores neon', 'Prata'],
    },
    bestCombinations: [
      { name: 'Pop', colors: ['#FF0000', '#0000FF', '#FFFFFF'], description: 'Vermelho + azul + branco' },
      { name: 'Neon', colors: ['#FF00FF', '#00FFFF', '#000000'], description: 'Magenta + ciano + preto' },
      { name: 'Electric', colors: ['#FFFF00', '#FF1493', '#000000'], description: 'Amarelo + pink + preto' },
    ],
    stylingTips: [
      'Você nasceu para cores vibrantes',
      'Preto e branco em alto contraste são perfeitos',
      'Color blocking é sua especialidade',
      'Nunca tenha medo de cores que "chamam atenção"',
    ],
    seasonIcon: '⚡',
  },
];

// Helper functions
export function getSeasonById(id: string): SeasonData | undefined {
  return chromaticSeasons.find(s => s.id === id);
}

export function getSeasonsByMainSeason(mainSeason: 'primavera' | 'verão' | 'outono' | 'inverno'): SeasonData[] {
  return chromaticSeasons.filter(s => s.mainSeason === mainSeason);
}

export function getSeasonsByTemperature(temp: 'warm' | 'cool' | 'neutral-warm' | 'neutral-cool'): SeasonData[] {
  return chromaticSeasons.filter(s => s.characteristics.temperature === temp);
}

export function getSeasonsByDepth(depth: 'light' | 'medium' | 'deep'): SeasonData[] {
  return chromaticSeasons.filter(s => s.characteristics.depth === depth);
}

export function findClosestSeason(characteristics: Partial<SeasonData['characteristics']>): SeasonData[] {
  return chromaticSeasons.filter(s => {
    let matches = 0;
    if (characteristics.temperature && s.characteristics.temperature === characteristics.temperature) matches++;
    if (characteristics.depth && s.characteristics.depth === characteristics.depth) matches++;
    if (characteristics.chroma && s.characteristics.chroma === characteristics.chroma) matches++;
    return matches >= 2;
  });
}
