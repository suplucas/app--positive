import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { ProfileScreen } from './ProfileScreen';
import { bioFor, displayName } from './mockData';

function render(props: Partial<Parameters<typeof ProfileScreen>[0]> = {}) {
  const userId = props.userId ?? 'bea_come_tudo';
  const profile = props.profile ?? {
    id: userId,
    name: displayName(userId),
    handle: userId,
    bio: bioFor(userId),
    isFollowing: false,
    stats: {
      reviews: 184,
      followers: 92,
      following: 76,
      notaMedia: 9.1,
    },
  };
  const r: ReactTestRenderer = create(
    createElement(ProfileScreen, { userId, profile, ...props }),
  );
  return { r, text: () => JSON.stringify(r.toJSON()) };
}

function textsOf(r: ReactTestRenderer, testID: string): string {
  return r.root
    .findByProps({ testID })
    .findAll((n) => String(n.type) === 'Text')
    .map((n) =>
      Array.isArray(n.props.children)
        ? n.props.children.join('')
        : String(n.props.children ?? ''),
    )
    .join(' ');
}

describe('ProfileScreen (v2)', () => {
  it('mostra nome, handle, bio e stats', () => {
    const { text } = render();
    expect(text()).toContain('Bea Ferraz');
    expect(text()).toContain('@bea_come_tudo');
    expect(text()).toContain('184');
    expect(text()).toContain('Crítica de fim de semana');
  });

  it('diário mostra as reviews recebidas da API', () => {
    const review = {
      id: 1,
      userId: 'ana',
      restaurantId: '123',
      rating: 4.5,
      comment: 'review vinda da api',
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const { text } = render({ reviews: [review] });
    expect(text()).toContain('review vinda da api');
  });

  it('não mostra seguir no próprio perfil', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'seguir' })).toHaveLength(0);
  });

  it('não tem aba listas (sem endpoint real)', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'tab-listas' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'tab-quero-ir' }).length).toBeGreaterThan(0);
    expect(r.root.findAllByProps({ testID: 'tab-diario' }).length).toBeGreaterThan(0);
  });

  it('não tem seletor de versão e mantém as abas', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'perfil-v1' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'perfil-v2' })).toHaveLength(0);
    expect(
      r.root.findAllByProps({ testID: 'tab-listas' }).length,
    ).toBe(0);
    expect(r.root.findAllByProps({ testID: 'tab-diario' }).length).toBeGreaterThan(0);
  });

  it('bio fica dentro do bloco do username, abaixo do handle', () => {
    const { r } = render();
    const identidade = textsOf(r, 'perfil-identidade');
    expect(identidade).toContain('Bea Ferraz');
    expect(identidade).toContain('@bea_come_tudo');
    expect(identidade).toContain('Crítica de fim de semana');
  });
});

describe('ProfileScreen (aba quero ir, docs/16)', () => {
  const CJNPJ = '09597505000150';

  it('aba "quero ir · N" mostra a lista e abre a página do restaurante', () => {
    const onOpenRestaurant = vi.fn();
    const { r, text } = render({ savedCnpjs: [CJNPJ], onOpenRestaurant });
    expect(text()).toContain('quero ir · 1');
    act(() => {
      r.root.findByProps({ testID: 'tab-quero-ir' }).props.onPress();
    });
    expect(r.root.findByProps({ testID: `salvo-linha-${CJNPJ}` })).toBeTruthy();
    act(() => {
      r.root.findByProps({ testID: `salvo-linha-${CJNPJ}` }).props.onPress();
    });
    expect(onOpenRestaurant).toHaveBeenCalledWith(CJNPJ);
  });

  it('aba vazia explica como salvar', () => {
    const { r } = render();
    act(() => {
      r.root.findByProps({ testID: 'tab-quero-ir' }).props.onPress();
    });
    expect(r.root.findByProps({ testID: 'salvo-vazio' })).toBeTruthy();
  });
});

describe('ProfileScreen (usuário ativo, N5)', () => {
  it('reflete o usuário demo (mogli) em nome e handle', () => {
    const { text } = render({ userId: 'mogli' });
    expect(text()).toContain('Mogli');
    expect(text()).toContain('@mogli');
    // Bea some da identidade
    expect(text()).not.toContain('Bea Ferraz');
  });

  it('usuário desconhecido (user_1): nome derivado, nunca vazio', () => {
    const { text } = render({ userId: 'user_1' });
    expect(text()).toContain('User 1');
    expect(text()).toContain('@user_1');
  });

  it('padrão continua sendo a Bea', () => {
    const { text } = render();
    expect(text()).toContain('Bea Ferraz');
    expect(text()).toContain('@bea_come_tudo');
  });
});

describe('ProfileScreen (notificações, docs/16)', () => {
  it('sino só aparece com onNotifications e chama o callback', () => {
    expect(
      render().r.root.findAllByProps({ testID: 'abrir-notificacoes' }).length,
    ).toBe(0);
    const onNotifications = vi.fn();
    const { r } = render({ onNotifications });
    act(() => {
      r.root.findByProps({ testID: 'abrir-notificacoes' }).props.onPress();
    });
    expect(onNotifications).toHaveBeenCalled();
  });
});

describe('ProfileScreen (configurações)', () => {
  it('botão de configurações chama onSettings', () => {
    const onSettings = vi.fn();
    const { r } = render({ onSettings });
    act(() => {
      r.root.findByProps({ testID: 'configuracoes' }).props.onPress();
    });
    expect(onSettings).toHaveBeenCalled();
  });
});
