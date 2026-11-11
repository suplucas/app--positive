import { describe, it, expect } from 'vitest';
import { create } from 'react-test-renderer';
import { createElement } from 'react';
import { Image, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { AvatarStack } from './AvatarStack';

const people1 = [{ id: 'bea', name: 'Bea' }];
const people3 = [
  { id: 'bea', name: 'Bea' },
  { id: 'mari', name: 'Mari' },
  { id: 'lu', name: 'Lu' },
];

const flat = (style: unknown): Record<string, unknown>[] =>
  Array.isArray(style) ? style.flatMap(flat) : [style as Record<string, unknown>];

describe('AvatarStack (painel de notificações)', () => {
  it('1 pessoa → círculo único de 44 com inicial', () => {
    const r = create(createElement(AvatarStack, { people: people1 }));
    const circles = r.root
      .findAllByType(View)
      .filter(
        (n) => flat(n.props.style).some((s) => s?.width === 44 && s?.borderRadius === 22),
      );
    expect(circles).toHaveLength(1);
    expect(
      r.root.findAllByType(Text).map((n) => n.props.children),
    ).toContain('B');
  });

  it('2+ pessoas → dois círculos de 32; o de trás ganha borda', () => {
    const r = create(createElement(AvatarStack, { people: people3 }));
    const circles = r.root
      .findAllByType(View)
      .filter((n) => flat(n.props.style).some((s) => s?.width === 32 && s?.borderRadius === 16));
    expect(circles).toHaveLength(2); // terceira pessoa ignorada
    expect(
      circles.filter((n) =>
        flat(n.props.style).some((s) => s?.borderWidth === 2),
      ),
    ).toHaveLength(1);
  });

  it('photoUrl vira foto', () => {
    const r = create(
      createElement(AvatarStack, {
        people: [
          { id: 'bea', name: 'Bea', photoUrl: 'https://cdn.test/p.jpg' },
        ],
      }),
    );
    expect(r.root.findAllByType(Image)).toHaveLength(1);
  });

  it('tag mostra o ícone lucide no selo colorido', () => {
    const r = create(
      createElement(AvatarStack, {
        people: people1,
        tag: { color: '#E63E75', icon: Heart },
      }),
    );
    expect(r.root.findByType(Heart)).toBeTruthy();
    const badge = r.root
      .findAllByType(View)
      .find((n) => flat(n.props.style).some((s) => s?.backgroundColor === '#E63E75'));
    expect(badge).toBeDefined();
  });
});
