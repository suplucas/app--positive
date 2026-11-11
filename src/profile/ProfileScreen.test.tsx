import { describe, it, expect, vi } from 'vitest';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { ProfileScreen } from './ProfileScreen';
import { bioFor, displayName } from '../common/mockData';

function render(props: Partial<Parameters<typeof ProfileScreen>[0]> = {}) {
  const userId = props.userId ?? 'bea_come_tudo';
  const profile = props.profile ?? {
    id: userId,
    name: displayName(userId),
    username: userId,
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

  it('diário expõe editar/apagar quando o App passa os callbacks', () => {
    const review = {
      id: 1,
      userId: 'bea_come_tudo',
      restaurantId: '123',
      rating: 4.5,
      comment: 'review vinda da api',
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const onEditReview = vi.fn();
    const onDeleteReview = vi.fn();
    const { r } = render({ reviews: [review], onEditReview, onDeleteReview });
    act(() => {
      r.root.findByProps({ testID: 'editar-1' }).props.onPress();
    });
    act(() => {
      r.root.findByProps({ testID: 'apagar-1' }).props.onPress();
    });
    expect(onEditReview).toHaveBeenCalledWith(review);
    expect(onDeleteReview).toHaveBeenCalledWith(review);
  });

  it('diário sem callbacks: nenhum botão de dono', () => {
    const review = {
      id: 1,
      userId: 'bea_come_tudo',
      restaurantId: '123',
      rating: 4.5,
      comment: 'review vinda da api',
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    const { r } = render({ reviews: [review] });
    expect(r.root.findAllByProps({ testID: 'editar-1' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'apagar-1' })).toHaveLength(0);
  });

  it('perfil próprio expõe "editar perfil" quando há callback', () => {
    const onEditProfile = vi.fn();
    const { r } = render({ onEditProfile });
    act(() => {
      r.root.findByProps({ testID: 'editar-perfil' }).props.onPress();
    });
    expect(onEditProfile).toHaveBeenCalled();
  });

  it('sem callback, não mostra "editar perfil"', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'editar-perfil' })).toHaveLength(0);
  });

  it('não tem aba listas (sem endpoint real)', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'tab-listas' })).toHaveLength(0);
    expect(
      r.root.findAllByProps({ testID: 'tab-quero-ir' }).length,
    ).toBeGreaterThan(0);
    expect(
      r.root.findAllByProps({ testID: 'tab-diario' }).length,
    ).toBeGreaterThan(0);
  });

  it('não tem seletor de versão e mantém as abas', () => {
    const { r } = render();
    expect(r.root.findAllByProps({ testID: 'perfil-v1' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'perfil-v2' })).toHaveLength(0);
    expect(r.root.findAllByProps({ testID: 'tab-listas' }).length).toBe(0);
    expect(
      r.root.findAllByProps({ testID: 'tab-diario' }).length,
    ).toBeGreaterThan(0);
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

describe('ProfileScreen (atalho de configurações)', () => {
  it('engrenagem lucide aparece com onSettings e chama o callback', () => {
    const onSettings = vi.fn();
    const { r } = render({ onSettings });
    const btn = r.root.findByProps({ testID: 'configuracoes' });
    expect(btn.findByType(SettingsIcon)).toBeTruthy();
    act(() => {
      btn.props.onPress();
    });
    expect(onSettings).toHaveBeenCalled();
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
