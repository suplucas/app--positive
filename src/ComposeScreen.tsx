import { ComposeV2 } from './ComposeV2';

// Tela de avaliação na versão final (docs_04/docs_16). O seletor v1/v2
// foi removido; o fluxo é sempre o ComposeV2 (slider, foto, flairs e
// preview), com o contrato de navegação inalterado.
export function ComposeScreen({
  userId,
  initialCnpj,
  onCancel,
  onPosted,
  onChangePlace,
  pickedCnpj,
}: {
  userId: string;
  initialCnpj?: string | null;
  onCancel: () => void;
  onPosted: () => void;
  // docs/16: "trocar" abre a busca em modo picker; `pickedCnpj` é o
  // resultado escolhido, devolvido pelo App.
  onChangePlace?: () => void;
  pickedCnpj?: string | null;
}) {
  return (
    <ComposeV2
      userId={userId}
      initialCnpj={initialCnpj}
      onCancel={onCancel}
      onPosted={onPosted}
      onChangePlace={onChangePlace}
      pickedCnpj={pickedCnpj}
    />
  );
}
