import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { UserProfileScreen } from './UserProfileScreen';
import { useUserProfile } from './useUserProfile';

vi.mock('./useUserProfile', () => ({ useUserProfile: vi.fn() }));

const profile = {
  id: 'u2',
  name: 'Mogli',
  handle: 'mogli',
  bio: 'comendo por aí',
  isFollowing: false,
  stats: { reviews: 3, followers: 10, following: 5, notaMedia: 8.5 },
};

function render(props: Partial<Parameters<typeof UserProfileScreen>[0]> = {}) {
  const r = create(
    createElement(UserProfileScreen, {
      userId: 'u2',
      viewerId: 'u1',
      onBack: vi.fn(),
      onOpenRestaurant: vi.fn(),
      ...props,
    }),
  ) as ReactTestRenderer;
  return r;
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

beforeEach(() => {
  vi.mocked(useUserProfile).mockReturnValue({
    profile,
    reviews: [],
    status: 'idle',
    error: null,
    following: false,
    toggleFollow: vi.fn(),
  });
});

describe('UserProfileScreen', () => {
  it('mostra nome, handle e stats', () => {
    const text = allText(render());
    expect(text).toContain('Mogli');
    expect(text).toContain('@mogli');
    expect(text).toContain('10');
  });

  it('seguir chama toggleFollow', () => {
    const toggleFollow = vi.fn();
    vi.mocked(useUserProfile).mockReturnValue({
      profile,
      reviews: [],
      status: 'idle',
      error: null,
      following: false,
      toggleFollow,
    });
    const r = render();
    act(() => {
      r.root.findByProps({ testID: 'user-seguir' }).props.onPress();
    });
    expect(toggleFollow).toHaveBeenCalled();
  });

  it('não mostra seguir no próprio perfil', () => {
    const r = render({ userId: 'u1', viewerId: 'u1' });
    expect(r.root.findAllByProps({ testID: 'user-seguir' })).toHaveLength(0);
  });

  it('voltar chama onBack', () => {
    const onBack = vi.fn();
    const r = render({ onBack });
    act(() => {
      r.root.findByProps({ testID: 'user-voltar' }).props.onPress();
    });
    expect(onBack).toHaveBeenCalled();
  });
});
