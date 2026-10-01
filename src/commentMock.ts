// Thread de comentários por review (docs/12): a API ainda não expõe
// comentários. A thread é gerada de forma determinística pelo id da
// review (mesma review → mesma conversa), como em `restaurantFor`.
// Substituir por endpoint real quando existir.

export type ReviewComment = {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
};

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

const TEXTS = [
  "era exatamente isso, o preparo faz toda a diferença aqui.",
  "fui semana passada e batendo palma pro balcão.",
  "a fila demora, mas o pessoal do balcão tá de parabéns.",
  "concordo, mas pro preço de hoje eu esperaria um pouco mais.",
  "o ponto do tremoço é outro, vale pedir pra esquentar mais.",
  "dica: peça com a farofa trocada, muda o jogão.",
  "anotei, entrou na minha lista de voltas.",
  "não achei, fui uma terça e tava fraco — mas o café era otimo.",
  "o clima de boteco + música boa vale o frete.",
  "garçom me ensinou a pedir a especial da casa. eu recomendo.",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// `id` usa o formato `{reviewId}-c{i}` (a UI espelha em testID).
export function commentsFor(reviewId: string): ReviewComment[] {
  const h = hash(reviewId);
  const count = 2 + (h % 3); // 2–4
  // "agora" arredondado à hora: mesmo reviewId gera a mesma thread
  // dentro da mesma hora (comparável em testes).
  const now = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  return Array.from({ length: count }, (_, i) => {
    const user = USERS[(h + i * 3) % USERS.length]!;
    return {
      id: `${reviewId}-c${i}`,
      userId: user,
      text: TEXTS[(h >>> (i * 2)) % TEXTS.length]!,
      // mais antigo primeiro; espaçamento 2–40h entre um e outro
      createdAt: new Date(
        now - (count * 40 - i * 17 - ((h >>> i) % 9) - i * 2) * 3_600_000,
      ).toISOString(),
    };
  });
}
