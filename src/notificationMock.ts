// Notificações mock (docs/09): a API ainda não expõe endpoint de
// notificação. Linhas com cnpj abrem a página do restaurante; as
// demais são informativas (curtidas, seguidores, novidades de "quero
// ir"). Substituir por endpoint real quando existir.

export type AppNotification = {
  id: string;
  icone: string;
  texto: string;
  cnpj?: string;
  createdAt: string;
};

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export const MOCK_NOTIF: AppNotification[] = [
  {
    id: "n1",
    icone: "♥",
    texto: "caio.garfo curtiu sua avaliação do Beco's Pizzaria",
    cnpj: "64523266000100",
    createdAt: hoursAgo(2),
  },
  {
    id: "n2",
    icone: "✎",
    texto: "renatocritico avaliou o MERCADO TUNICO — 9.4",
    cnpj: "21875754000165",
    createdAt: hoursAgo(6),
  },
  {
    id: "n3",
    icone: "★",
    texto: "3 avaliações novas nos lugares da sua lista Quero Ir",
    createdAt: hoursAgo(30),
  },
  {
    id: "n4",
    icone: "＋",
    texto: "isa.mastiga começou a seguir você",
    createdAt: hoursAgo(200),
  },
];
