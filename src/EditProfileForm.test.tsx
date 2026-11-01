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
  it('prefill: nome e bio atuais', () => {
    const { r } = render();
    expect(byID(r, 'perfil-nome').props.value).toBe('Bea Ferraz');
    expect(byID(r, 'perfil-bio').props.value).toBe('comendo por aí');
  });

  it('salvar envia nome e bio editados (trim)', () => {
    const { r, onSave } = render();
    act(() => byID(r, 'perfil-nome').props.onChangeText('  Bea Nova  '));
    act(() => byID(r, 'perfil-bio').props.onChangeText(' bio nova '));
    act(() => byID(r, 'salvar-perfil').props.onPress());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Nova',
      bio: 'bio nova',
    });
  });

  it('nome vazio desabilita salvar', () => {
    const { r } = render();
    act(() => byID(r, 'perfil-nome').props.onChangeText('   '));
    expect(
      byID(r, 'salvar-perfil').props.accessibilityState.disabled,
    ).toBe(true);
  });

  it('bio vazia vira null (limpar bio)', () => {
    const { r, onSave } = render();
    act(() => byID(r, 'perfil-bio').props.onChangeText('   '));
    act(() => byID(r, 'salvar-perfil').props.onPress());
    expect(onSave).toHaveBeenCalledWith({ name: 'Bea Ferraz', bio: null });
  });

  it('sem mexer na foto, não envia photoUri', () => {
    const { r, onSave } = render({
      initialPhotoUri: 'http://api.test/uploads/a.jpg',
    });
    act(() => byID(r, 'salvar-perfil').props.onPress());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Ferraz',
      bio: 'comendo por aí',
    });
  });

  it('escolher foto nova envia a uri local', async () => {
    const onPickPhoto = vi.fn().mockResolvedValue({ uri: 'file://foto.jpg' });
    const { r, onSave } = render({ onPickPhoto });
    await act(async () => {
      byID(r, 'trocar-foto').props.onPress();
    });
    act(() => byID(r, 'salvar-perfil').props.onPress());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Ferraz',
      bio: 'comendo por aí',
      photoUri: 'file://foto.jpg',
    });
  });

  it('remover foto existente envia photoUri null', () => {
    const { r, onSave } = render({
      initialPhotoUri: 'http://api.test/uploads/a.jpg',
    });
    act(() => byID(r, 'remover-foto').props.onPress());
    act(() => byID(r, 'salvar-perfil').props.onPress());
    expect(onSave).toHaveBeenCalledWith({
      name: 'Bea Ferraz',
      bio: 'comendo por aí',
      photoUri: null,
    });
  });

  it('cancelar chama onBack', () => {
    const { r, onBack } = render();
    act(() => byID(r, 'cancelar-perfil').props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
