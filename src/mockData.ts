// Dados mock onde a API ainda não alcança: pódio da semana e tela de
// perfil. Substituir por endpoints reais quando existirem.

// Lugar no mapa: posição percentual (x/y 0-100), info da rede social e
// estado de wishlist do usuário autenticado.
export type MapPlace = {
  id: number;
  name: string;
  hood: string;
  kind: string;
  price: 1 | 2 | 3 | 4;
  x: number;
  y: number;
  color: string;
  net: { avg: number; people: string[]; who: string } | null;
  saved?: string;
  wish: boolean;
};

export type MapPerson = {
  name: string;
  handle: string;
  meta: string;
  color: string;
  following: boolean;
};

export const MAP_PLACES: MapPlace[] = [
  { id:  1, name: 'Cantina do Nonno',        hood: 'Bixiga',         kind: 'italiano',      price: 2, x: 22, y: 19, color: '#8A3550', net: { avg: 8.9, people: ['#5E3E6B','#C98A3F','#3E6B5E'], who: '3 pessoas da sua rede foram'   }, wish: true  },
  { id:  2, name: 'Boteco da Ana',            hood: 'Pinheiros',      kind: 'boteco',        price: 1, x: 55, y: 22, color: '#5A6B3A', net: { avg: 9.4, people: ['#E63E75','#F2A93B'],            who: 'salvo de @lu_mesa · 2 foram'   }, wish: false },
  { id:  3, name: 'Sushi Kaza',               hood: 'Liberdade',      kind: 'japonês',       price: 3, x: 38, y: 34, color: '#3E5C78', net: { avg: 8.9, people: ['#E63E75'],                       who: '@bea_come_tudo avaliou'        }, wish: false },
  { id:  4, name: 'Padaria Santa Esquina',    hood: 'Pinheiros',      kind: 'café',          price: 1, x: 72, y: 14, color: '#C98A3F', net: null, saved: 'salvo de @lu_mesa · média 8.7',            wish: true  },
  { id:  5, name: 'Taqueria La Güera',        hood: 'Pinheiros',      kind: 'mexicano',      price: 1, x: 14, y: 38, color: '#5E3E6B', net: null,                                                    wish: false },
  { id:  6, name: 'Empório Real',             hood: 'Consolação',     kind: 'mercado gourm.',price: 2, x: 60, y: 41, color: '#C9A84C', net: { avg: 8.2, people: ['#3E5C78','#8A3550'],             who: '2 pessoas da sua rede foram'   }, wish: false },
  { id:  7, name: 'Coffee Lab Rua Fradique',  hood: 'Vila Madalena',  kind: 'café',          price: 2, x: 28, y: 54, color: '#7A5A3E', net: { avg: 9.0, people: ['#E63E75','#3E5C78'],             who: '2 pessoas da sua rede foram'   }, wish: true  },
  { id:  8, name: 'Bar Fiorella',             hood: 'Vila Madalena',  kind: 'bar',           price: 2, x: 48, y: 58, color: '#5A6B4A', net: null, saved: 'salvo de @tiago.come · média 8.1',         wish: true  },
  { id:  9, name: 'Shin-Zushi',               hood: 'Liberdade',      kind: 'japonês',       price: 3, x: 80, y: 32, color: '#3E4A5C', net: null,                                                    wish: false },
  { id: 10, name: 'Café Tupinambá',           hood: 'Centro',         kind: 'café',          price: 1, x: 17, y: 66, color: '#5A4A3E', net: null,                                                    wish: false },
  { id: 11, name: 'Pizzaria 1900',            hood: 'Bela Vista',     kind: 'pizza',         price: 2, x: 42, y: 72, color: '#5A6B3A', net: { avg: 9.1, people: ['#C98A3F'],                        who: '@bea_come_tudo avaliou'        }, wish: false },
  { id: 12, name: 'Yakissoba da Natasha',     hood: 'Liberdade',      kind: 'japonês',       price: 1, x: 65, y: 25, color: '#7A4A3A', net: null,                                                    wish: false },
  { id: 13, name: 'Mercearia Paulista',       hood: 'Consolação',     kind: 'bistrô',        price: 3, x: 53, y: 47, color: '#4A5C7A', net: { avg: 7.8, people: ['#5E3E6B'],                        who: '1 pessoa da sua rede foi'      }, wish: false },
];

export const MAP_PEOPLE: MapPerson[] = [
  { name: 'Lu Mesa',     handle: 'lu_mesa',     meta: '48 avaliações · curadora de bistrôs',  color: '#E63E75', following: true  },
  { name: 'Tiago Come',  handle: 'tiago.come',  meta: '91 avaliações · fanático por boteco',  color: '#F2A93B', following: true  },
  { name: 'Nina Prova',  handle: 'nina.prova',  meta: '23 avaliações · exploradora de bairro', color: '#7A9A3D', following: false },
  { name: 'Bea Ferraz',  handle: 'bea_come_tudo', meta: '184 avaliações · sommelier de boteco', color: '#8A3550', following: true },
  { name: 'Caio Garfo',  handle: 'caio.garfo',  meta: '57 avaliações · churrasco é cultura', color: '#3E5C78', following: false },
  { name: 'Manu Colher', handle: 'manu.colher', meta: '12 avaliações · novata mas criteriosa', color: '#5E3E6B', following: false },
];
export type PodioEntry = {
  place: 1 | 2 | 3;
  medal: string;
  name: string;
  note: string;
};

// Ordem visual: 2º, 1º, 3º (estilo pódio).
export const PODIO: PodioEntry[] = [
  { place: 2, medal: "🥈", name: "Sushi Kaza", note: "8.9" },
  { place: 1, medal: "🥇", name: "Boteco da Ana", note: "9.4" },
  { place: 3, medal: "🥉", name: "Empório Real", note: "8.2" },
];

// Célula do diário: quadrado só com a nota, quote card largo com opinião
// em destaque, ou uma foto real (photoIndex em assets/posts). `cor` é o
// fundo (usado atrás da foto e no chip de nota).
export type DiaryCell =
  | { kind: "note"; cor: string; nota: string; photoIndex?: number }
  | { kind: "photo"; cor: string; nota: string; photoIndex: number }
  | { kind: "quote"; cor: string; nota: string; place: string; text: string };

// Item da estante de favoritos: cor sólida ou foto real (photoIndex).
export type FavoriteItem = { cor: string; nota: string; photoIndex?: number };

// Destaque (bento v3): card foto ou texto no mosaico de destaques.
export type HighlightCard = {
  kind: "photo" | "text";
  place: string;
  quote: string;
  nota?: string;
  cor: string;
  photoIndex?: number;
};

// Item da wishlist ("quero conhecer"): lugar salvo pra visitar.
export type WishItem = {
  place: string;
  bairro: string;
  tipo: string;
  preco: string;
  tag: 'jantar' | 'bar' | 'cafe';
  cor: string;
  socialDots: string[];
  socialText: string;
};

// Entrada do diário (lista v3): coluna de data + miniatura + corpo.
export type DiaryEntry = {
  day: number;
  weekday: string;
  place: string;
  nota?: string;
  excerpt?: string;
  cor: string;
  photoIndex?: number;
};

export const PERFIL = {
  userId: "bea_come_tudo",
  nome: "Bea Ferraz",
  handle: "@bea_come_tudo · São Paulo",
  nicho: "sommelier de boteco",
  bio: "Crítica de fim de semana. Se a fila for grande, provavelmente eu tô nela.",
  stats: [
    { n: "184", l: "avaliações" },
    { n: "92", l: "seguidores" },
    { n: "76", l: "seguindo" },
    { n: "9.1", l: "média" },
  ],
  favoritos: [
    { cor: "#C98A3F", nota: "9.6", photoIndex: 0 }, // foto real (exemplo)
    { cor: "#8A3550", nota: "9.4", photoIndex: 1 }, // foto real (exemplo)
    { cor: "#5A6B3A", nota: "9.2", photoIndex: 2 }, // foto real (exemplo)
  ] as FavoriteItem[],
  diario: [
    { kind: "note", cor: "#C98A3F", nota: "9.1", photoIndex: 0 },
    { kind: "note", cor: "#5A6B3A", nota: "4.6", photoIndex: 1 },
    {
      kind: "quote",
      cor: "#F2A93B",
      nota: "8.2",
      place: "Empório Real",
      text: "Fila valeu cada minuto, sem exagero.",
    },
    { kind: "note", cor: "#8A3550", nota: "7.8", photoIndex: 3 },
    { kind: "note", cor: "#3E5C78", nota: "8.4", photoIndex: 4 },
    { kind: "note", cor: "#7A5A3E", nota: "6.9", photoIndex: 5 },
    {
      kind: "quote",
      cor: "#E63E75",
      nota: "9.6",
      place: "Boteco da Ana",
      text: "Chorei de tão bom, sem exagero nenhum.",
    },
    { kind: "note", cor: "#5E3E6B", nota: "9.6", photoIndex: 6 },
  ] as DiaryCell[],
  destaques: [
    {
      kind: "photo",
      place: "Boteco da Ana",
      quote: "A cachaça mais honesta de SP.",
      nota: "9.6",
      cor: "#8A3550",
      photoIndex: 0,
    },
    {
      kind: "text",
      place: "Empório Real",
      quote: "Fila valeu cada minuto, sem exagero.",
      nota: "8.2",
      cor: "#F2A93B",
    },
    {
      kind: "photo",
      place: "Sushi Kaza",
      quote: "Yakissoba pra chamar de meu.",
      nota: "8.9",
      cor: "#3E5C78",
      photoIndex: 2,
    },
  ] as HighlightCard[],
  diarioEntradas: [
    {
      day: 14,
      weekday: "sáb",
      place: "Boteco da Ana",
      nota: "9.6",
      excerpt: "A cachaça mais honesta de SP. Petiscos pra ficar a tarde inteira.",
      cor: "#8A3550",
      photoIndex: 0,
    },
    {
      day: 8,
      weekday: "dom",
      place: "Empório Real",
      nota: "8.2",
      excerpt: "Fila valeu cada minuto, sem exagero.",
      cor: "#C98A3F",
      photoIndex: 1,
    },
    {
      day: 3,
      weekday: "ter",
      place: "Sushi Kaza",
      nota: "8.9",
      cor: "#3E5C78",
      photoIndex: 2,
    },
    {
      day: 28,
      weekday: "sáb",
      place: "Café Tupinambá",
      nota: "7.4",
      excerpt: "Cheiro bom, barulho demais.",
      cor: "#5A4A3E",
    },
    {
      day: 21,
      weekday: "dom",
      place: "Pizzaria 1900",
      nota: "9.1",
      excerpt: "A melhor calzone que eu já comi na vida.",
      cor: "#5A6B3A",
      photoIndex: 4,
    },
  ] as DiaryEntry[],
  // Lugares salvos para visitar (aba "wishlist" do perfil v2).
  wishlist: [
    { place: 'Shin-Zushi',             bairro: 'Liberdade',     tipo: 'japonês',       preco: '$$$', tag: 'jantar', cor: '#3E5C78', socialDots: ['#E63E75','#F2A93B'],           socialText: '2 amigos foram · média 9.3'        },
    { place: 'Padaria Santa Esquina',   bairro: 'Pinheiros',     tipo: 'café da manhã', preco: '$',   tag: 'cafe',   cor: '#C98A3F', socialDots: ['#7A9A3D'],                    socialText: 'salvo de @lu_mesa · média 8.7'     },
    { place: 'Cantina do Nonno',        bairro: 'Bixiga',        tipo: 'italiano',      preco: '$$',  tag: 'jantar', cor: '#8A3550', socialDots: ['#5E3E6B','#C98A3F','#3E6B5E'], socialText: '3 amigos foram · média 8.9'        },
    { place: 'Bar Fiorella',            bairro: 'Vila Madalena', tipo: 'boteco',        preco: '$$',  tag: 'bar',    cor: '#5A6B3A', socialDots: ['#F2A93B'],                    socialText: 'salvo de @tiago.come · média 8.1'  },
    { place: 'Coffee Lab Rua Fradique', bairro: 'Vila Madalena', tipo: 'café',          preco: '$$',  tag: 'cafe',   cor: '#7A5A3E', socialDots: ['#E63E75','#3E5C78'],           socialText: '2 amigos foram · média 9.0'        },
    { place: 'Taqueria La Güera',       bairro: 'Pinheiros',     tipo: 'mexicano',      preco: '$',   tag: 'bar',    cor: '#5E3E6B', socialDots: ['#8A3550'],                    socialText: 'salvo de @nina.prova · ainda sem nota' },
  ] as WishItem[],

  // Curadorias do usuário (aba "listas" do perfil v2). `cores` alimenta o
  // colagem 2×2 do card (a 1ª ocupa a coluna inteira).
  listas: [
    {
      title: "Melhores pizzarias de SP",
      meta: "12 lugares · atualizada há 3 dias",
      cores: ["#C98A3F", "#8A3550", "#5A6B3A"],
    },
    {
      title: "Pra ir sozinho sem graça",
      meta: "7 lugares · atualizada há 1 semana",
      cores: ["#3E5C78", "#7A5A3E", "#5E3E6B"],
    },
    {
      title: "Café bom de verdade",
      meta: "9 lugares · atualizada há 2 semanas",
      cores: ["#8A6B3E", "#3E6B5E", "#6B4A3E"],
    },
    {
      title: "Levar visita de fora",
      meta: "15 lugares · atualizada ontem",
      cores: ["#5A6B3A", "#C98A3F", "#8A3550"],
    },
  ],
};
