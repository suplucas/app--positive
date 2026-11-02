import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { createElement } from 'react';
import { EditProfileScreen } from './EditProfileScreen';
import { updateUserProfile } from './api/user';
import { uploadAvatarPhoto } from './api';
import type { UserProfile } from './api/types';

vi.mock('./api', () => ({ uploadAvatarPhoto: vi.fn() }));
vi.mock('./api/user', () => ({ updateUserProfile: vi.fn() }));

const updateMock = vi.mocked(updateUserProfile);
const uploadMock = vi.mocked(uploadAvatarPhoto);

const profile: UserProfile = {
  id: 'user_1',
  name: 'Bea',
  handle: 'bea',
  bio: 'bio atual',
  photoUrl: null,
  isFollowing: false,
  stats: { reviews: 0, followers: 0, following: 0, notaMedia: null },
};

function render(props: Partial<Parameters<typeof EditProfileScreen>[0]> = {}) {
  const onSaved = vi.fn();
  const onBack = vi.fn();
  const r = create(
    createElement(EditProfileScreen, {
      userId: 'user_1',
      profile,
      onSaved,
      onBack,
      ...props,
    }),
  ) as ReactTestRenderer;
  return { r, onSaved, onBack };
}

function byID(r: ReactTestRenderer, id: string) {
  return r.root.findByProps({ testID: id });
}

beforeEach(() => {
  updateMock.mockReset();
  uploadMock.mockReset();
});

describe('EditProfileScreen', () => {
  it('salva nome/bio pelo PUT e chama onSaved', async () => {
    updateMock.mockResolvedValue(profile);
    const { r, onSaved } = render();
    await act(async () => {
      byID(r, 'salvar-perfil').props.onPress();
    });
    expect(updateMock).toHaveBeenCalledWith('user_1', {
      name: 'Bea',
      bio: 'bio atual',
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it('foto nova: faz upload e envia photoUrl', async () => {
    updateMock.mockResolvedValue(profile);
    uploadMock.mockResolvedValue('/uploads/avatar.jpg');
    const { r } = render({
      onPickPhoto: async () => ({ uri: 'file://foto.jpg' }),
    });
    await act(async () => {
      byID(r, 'trocar-foto').props.onPress();
    });
    await act(async () => {
      byID(r, 'salvar-perfil').props.onPress();
    });
    expect(uploadMock).toHaveBeenCalledWith('user_1', 'file://foto.jpg');
    expect(updateMock).toHaveBeenCalledWith('user_1', {
      name: 'Bea',
      bio: 'bio atual',
      photoUrl: '/uploads/avatar.jpg',
    });
  });

  it('erro no PUT mostra mensagem e não chama onSaved', async () => {
    updateMock.mockRejectedValue(new Error('PUT /users/user_1 failed: 500'));
    const { r, onSaved } = render();
    await act(async () => {
      byID(r, 'salvar-perfil').props.onPress();
    });
    expect(onSaved).not.toHaveBeenCalled();
    expect(byID(r, 'perfil-erro')).toBeTruthy();
  });
});
