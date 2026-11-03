import { describe, it, expect, vi } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { RegisterScreen } from './RegisterScreen';
import { ApiError } from './api/client';

function render(onSubmit: (input: unknown) => Promise<void>) {
  return create(
    createElement(RegisterScreen, { onSubmit, onSwitch: vi.fn() }),
  ) as ReactTestRenderer;
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

function fill(r: ReactTestRenderer) {
  act(() => byID(r, 'register-nome').props.onChangeText('Bea'));
  act(() => byID(r, 'register-email').props.onChangeText('bea@tim.app'));
  act(() => byID(r, 'register-senha').props.onChangeText('timtimtim'));
}

describe('RegisterScreen (erro da API vira copy acionável)', () => {
  it('403 mostra "convite inválido"', async () => {
    const r = render(vi.fn().mockRejectedValue(new ApiError(403, '/auth/register')));
    fill(r);
    await act(async () => {
      byID(r, 'register-criar').props.onPress();
    });
    expect(byID(r, 'register-erro').props.children).toMatch(/convite inválido/i);
  });

  it('409 mostra "email já tem conta"', async () => {
    const r = render(vi.fn().mockRejectedValue(new ApiError(409, '/auth/register')));
    fill(r);
    await act(async () => {
      byID(r, 'register-criar').props.onPress();
    });
    expect(byID(r, 'register-erro').props.children).toMatch(/já tem conta/i);
  });

  it('400 mostra "senha com ao menos 8"', async () => {
    const r = render(vi.fn().mockRejectedValue(new ApiError(400, '/auth/register')));
    fill(r);
    await act(async () => {
      byID(r, 'register-criar').props.onPress();
    });
    expect(byID(r, 'register-erro').props.children).toMatch(/senha com ao menos 8/i);
  });
});
