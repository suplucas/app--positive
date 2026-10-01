import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { NotificationScreen } from './NotificationScreen';

function render(props: Partial<Parameters<typeof NotificationScreen>[0]> = {}) {
  const onOpenRestaurant = props.onOpenRestaurant ?? vi.fn();
  const r = create(
    createElement(NotificationScreen, { onOpenRestaurant, ...props }),
  );
  return { r: r as ReactTestRenderer, onOpenRestaurant };
}

function allText(r: ReactTestRenderer): string {
  return r.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

describe('NotificationScreen (docs/09, mock)', () => {
  it('renderiza as 4 notificações mock', () => {
    const { r } = render();
    for (const id of ['notif-n1', 'notif-n2', 'notif-n3', 'notif-n4']) {
      expect(r.root.findByProps({ testID: id })).toBeTruthy();
    }
  });

  it('copy de produto: autor e ação legíveis', () => {
    const { r } = render();
    const text = allText(r);
    expect(text).toContain('caio.garfo');
    expect(text).toContain('curtiu sua avaliação');
    expect(text).toContain('começou a seguir você');
  });

  it('linha com cnpj abre a página do restaurante', () => {
    const { r, onOpenRestaurant } = render();
    act(() => {
      r.root.findByProps({ testID: 'notif-n1' }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith('64523266000100');
  });

  it('linha sem cnpj é inerte (sem onPress)', () => {
    const { r } = render();
    expect(r.root.findByProps({ testID: 'notif-n3' }).props.onPress).toBeUndefined();
  });

  it('tempo relativo no rodapé de cada linha', () => {
    const { r } = render();
    const text = allText(r);
    expect(text).toContain('2h');
    expect(text).toContain('d');
  });
});
