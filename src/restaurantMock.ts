import type { Review } from "./types";
import { restaurantNames } from "./restaurantNames";

// Dados da página do restaurante (mock docs_05). A API ainda não tem
// endpoint de restaurante — stats, flairs agregados e reviews são gerados
// de forma determinística a partir do CNPJ (mesmo CNPJ → mesma página).
// Trocar por endpoint real quando existir.

export type FlairCount = { label: string; count: number };

export type RestaurantData = {
  cnpj: string;
  nome: string;
  categoria: string;
  bairro: string;
  preco: string;
  distanciaKm: number;
  capa: string; // cor sólida do cover (gradiente não existe em RN puro)
  notaMedia: number; // escala 0-10
  totalAvaliacoes: number;
  queroIr: number;
  flairs: FlairCount[]; // 1º = mais votado (renderizado forte)
  seguemAvaliaram: string[]; // handles p/ a linha de social proof
  reviews: Review[];
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

const CATEGORIAS = ["boteco", "brasil", "massa", "japonesa", "café", "sorvete"];
const BAIRROS = [
  "Vila Madalena",
  "Pinheiros",
  "Moema",
  "Centro",
  "Sumaré",
  "Vila Mariana",
];
const PRECOS = ["$$", "$", "$$$"];
const CAPAS = ["#C98A3F", "#8A3550", "#5A6B3A", "#3E5C78"];
const FLAIR_LABELS = [
  "volto sim",
  "boa pra ir só",
  "fila vale a pena",
  "achado",
  "prato pequeno",
];
const USERS = [
  "renatocritico",
  "juu.talher",
  "bea_come_tudo",
  "caio.garfo",
  "isa.mastiga",
  "bruce",
  "maria_fome",
  "lucas.comida",
];
const COMMENTS = [
  "Atendimento rápido mesmo lotado, raro pra um lugar desse tamanho.",
  "Voltei uma segunda vez só pra testar outro prato — não decepciona.",
  "Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.",
  "Fila longa, mas o balcão serve rápido. Voltaria.",
  "Sabor acima da média, porção abaixo do prometido.",
  "Ambiente simples, mas come-se muito bem aqui.",
  "Levei visita de fora e saiu elogiando até na volta.",
  "Preço justo pro cardápio que dão.",
];

export function restaurantFor(cnpj: string): RestaurantData {
  const h = hash(cnpj);
  const pick = <T>(arr: T[], i: number): T =>
    arr[((i % arr.length) + arr.length) % arr.length]!;

  const users = [pick(USERS, h), pick(USERS, (h >>> 5) % 16)];
  if (users[1] === users[0]) users[1] = pick(USERS, h + 1);

  const reviews: Review[] = Array.from({ length: 5 }, (_, i) => ({
    id: `${cnpj}-r${i}`,
    userId: pick(USERS, h + i),
    restaurantCnpj: cnpj,
    // `>>>` (não `>>`): shift com sinal pode dar negativo e jogar a
    // nota/likes/distância pra fora da faixa.
    rating: 2.5 + ((h >>> (i * 3)) % 25) / 10, // 2.5–4.9 (escala API 0-5)
    comment: pick(COMMENTS, (h >>> (i * 4)) + i),
    likes: (h >>> i) % 120,
    createdAt: new Date(
      Date.now() - (1 + ((h >>> i) % 55)) * 86_400_000,
    ).toISOString(),
  }));

  return {
    cnpj,
    nome: restaurantNames[cnpj] ?? cnpj,
    categoria: pick(CATEGORIAS, h),
    bairro: pick(BAIRROS, h >>> 2),
    preco: pick(PRECOS, h >>> 4),
    distanciaKm: 0.3 + ((h >>> 8) % 40) / 10,
    capa: pick(CAPAS, h),
    notaMedia: 6.5 + (h % 35) / 10, // 6.5–9.9
    totalAvaliacoes: 37 + (h % 400),
    queroIr: 3 + (h % 80),
    flairs: FLAIR_LABELS.map((label, i) => ({
      label,
      count: 4 + (((h >>> (i * 2)) & 0xffff) % 70),
    })),
    seguemAvaliaram: users,
    reviews,
  };
}
