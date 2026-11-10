import { ComposeV2 } from './ComposeV2';

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
