import type { Review } from "./types";

// Usuário de demonstração: feed 100% local, montado só com as imagens de
// assets/posts. Não chama o backend (ver short-circuit em useFeed).
export const MOCK_USER = "mock";

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

// Reproduz o mix de cards do mock de feed (docs/03): quote card textual,
// linha compacta e post com foto. `layout` fixa o formato; `photoIndex`
// aponta para a lista em postPhotos.ts (0 = bat.jpeg, 1 = batprofile.jpg).
export const MOCK_FEED: Review[] = [
  {
    id: "mock-1",
    userId: "bea_come_tudo",
    restaurantCnpj: "09597505000150", // BAR DO LECO
    rating: 4.55, // 9.1
    comment:
      "Pedi o mesmo prato três vezes só pra confirmar que não foi acidente.",
    likes: 128,
    createdAt: hoursAgo(3),
    layout: "quote",
  },
  {
    id: "mock-2",
    userId: "renatocritico",
    restaurantCnpj: "33229301000140", // Kyoto sushi bar
    rating: 2.3, // 4.6
    comment: "O hype é maior que o prato. Literalmente, cabia na palma da mão.",
    likes: 42,
    createdAt: hoursAgo(5),
    layout: "quote", //or row
  },
  {
    id: "mock-3",
    userId: "caio.garfo",
    restaurantCnpj: "21875754000165", // MERCADO TUNICO
    rating: 4.35, // 8.7
    comment:
      "Pastel de feira ainda ganha de qualquer coisa chique. Fila rápida.",
    likes: 61,
    createdAt: hoursAgo(4),
    layout: "photo",
    photoIndex: 0,
  },
  {
    id: "mock-4",
    userId: "isa.mastiga",
    restaurantCnpj: "17213391000125", // EMPORIO MEDITERRANEO LTDA
    rating: 3.9, // 7.8
    comment:
      "Descobri sem querer, agora é parada obrigatória com qualquer visita.",
    likes: 76,
    createdAt: hoursAgo(8),
    layout: "quote",
  },
  {
    id: "mock-5",
    userId: "juu.talher",
    restaurantCnpj: "11166492000106", // PADARIA SAO MARCOS
    rating: 3.25, // 6.5
    comment: "Café bom, atendimento devagar demais num dia de semana.",
    likes: 19,
    createdAt: hoursAgo(26),
    layout: "row",
  },
  {
    id: "mock-6",
    userId: "bruce",
    restaurantCnpj: "64523266000100", // Beco's Pizzaria
    rating: 4.3, // 8.6
    comment: "Massa fininha e recheio honesto. Voltarei sem pensar duas vezes.",
    likes: 88,
    createdAt: hoursAgo(30),
    layout: "photo",
    photoIndex: 1,
  },
];
