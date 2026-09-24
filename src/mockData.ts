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

export const PERFIL = {
  userId: "bea_come_tudo",
  nome: "Bea Ferraz",
  handle: "@bea_come_tudo · São Paulo",
  bio: "Crítica de fim de semana. Se a fila for grande, provavelmente eu tô nela.",
  stats: [
    { n: "184", l: "avaliações" },
    { n: "92", l: "seguidores" },
    { n: "76", l: "seguindo" },
    { n: "9.1", l: "média" },
  ],
  favoritos: [
    { cor: "#C98A3F", nota: "9.6" },
    { cor: "#8A3550", nota: "9.4" },
    { cor: "#5A6B3A", nota: "9.2" },
    { cor: "#3E5C78", nota: "9.0" },
  ],
  diario: [
    { cor: "#C98A3F", nota: "9.1" },
    { cor: "#5A6B3A", nota: "4.6" },
    { cor: "#8A3550", nota: "7.8" },
    { cor: "#3E5C78", nota: "8.4" },
    { cor: "#7A5A3E", nota: "6.9" },
    { cor: "#5E3E6B", nota: "9.6" },
    { cor: "#3E6B5E", nota: "5.2" },
    { cor: "#6B4A3E", nota: "8.9" },
  ],
};
