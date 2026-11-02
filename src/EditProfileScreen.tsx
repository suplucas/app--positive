import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { uploadAvatarPhoto } from './api';
import { updateUserProfile, type UserProfileEdit } from './api/user';
import type { UserProfile } from './api/types';
import { EditProfileForm, type EditProfileInput } from './EditProfileForm';
import { resolvePhotoUrl } from './format';
import { useProfile } from './useProfile';
import { useTheme } from './theme';

// Container da edição de perfil: carrega o perfil atual (ou usa o
// injetado), faz upload da foto nova e o PUT /users/:id.
export function EditProfileScreen({
  userId,
  onBack,
  onSaved,
  profile: injected,
  onPickPhoto,
}: {
  userId: string;
  onBack: () => void;
  onSaved: () => void;
  profile?: UserProfile;
  // Seam p/ testes injetarem a galeria sem tocar no native.
  onPickPhoto?: () => Promise<ImageSourcePropType | null>;
}) {
  const t = useTheme();
  const remote = useProfile(userId, !injected);
  const profile = injected ?? remote.profile;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <Text style={{ color: t.sub }}>carregando…</Text>
      </View>
    );
  }

  const save = (input: EditProfileInput) => {
    setSaving(true);
    setError(null);
    void (async () => {
      try {
        const body: UserProfileEdit = { name: input.name, bio: input.bio };
        if (input.photoUri !== undefined) {
          body.photoUrl = input.photoUri
            ? await uploadAvatarPhoto(userId, input.photoUri)
            : null;
        }
        await updateUserProfile(userId, body);
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setSaving(false);
      }
    })();
  };

  return (
    <EditProfileForm
      userId={userId}
      initialName={profile.name}
      initialBio={profile.bio}
      initialPhotoUri={
        profile.photoUrl ? resolvePhotoUrl(profile.photoUrl) : null
      }
      onPickPhoto={onPickPhoto}
      onSave={save}
      onBack={onBack}
      saving={saving}
      error={error}
    />
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
