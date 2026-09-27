// Dados mock onde a API ainda não alcança: pódio da semana e tela de
// perfil. Substituir por endpoints reais quando existirem.
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
