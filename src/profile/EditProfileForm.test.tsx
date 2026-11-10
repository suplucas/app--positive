import { describe, it, expect, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { EditProfileForm } from './EditProfileForm';

type Props = Parameters<typeof EditProfileForm>[0];

function render(props: Partial<Props> = {}) {
  const onSave = props.onSave ?? vi.fn();
  const onBack = props.onBack ?? vi.fn();
  const r = create(
    createElement(EditProfileForm, {
      userId: 'user_1',
      initialName: 'Bea Ferraz',
      initialBio: 'comendo por aí',
      initialPhotoUri: null,
      onSave,
      onBack,
      ...props,
    }),
  ) as ReactTestRenderer;
  return { r, onSave, onBack };
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

describe('EditProfileForm', () => {
  it('salva nome e bio', async () => {
    const onSave = vi.fn();
    const { r } = render({ onSave });
    act(() => byID(r, 'perfil-nome').props.onChangeText('Bea Atualizada'));
    act(() => byID(r, 'perfil-bio').props.onChangeText('bio nova'));
    await act(async () => {
      byID(r, 'salvar-perfil').props.onPress();
    });
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Atualizada',
      bio: 'bio nova',
    });
  });

  it('bio vazia vira null', async () => {
    const onSave = vi.fn();
    const { r } = render({ onSave });
    act(() => byID(r, 'perfil-bio').props.onChangeText(''));
    await act(async () => {
      byID(r, 'salvar-perfil').props.onPress();
    });
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Ferraz',
      bio: null,
    });
  });

  it('cancelar chama onBack', () => {
    const onBack = vi.fn();
    const { r } = render({ onBack });
    act(() => byID(r, 'cancelar-perfil').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
