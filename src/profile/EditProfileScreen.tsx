import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { updateUserProfile, type UserProfileEdit } from '../api/user';
import type { UserProfile } from '../api/types';
import { EditProfileForm, type EditProfileInput } from './EditProfileForm';
import { useProfile } from './useProfile';
import { useTheme } from '../common/theme';

// Container da edição de perfil: carrega o perfil atual (ou usa o
// injetado) e faz PUT /users/:id com nome, bio e photoUrl.
export function EditProfileScreen({
  userId,
  onBack,
  onSaved,
  profile: injected,
}: {
  userId: string;
  onBack: () => void;
  onSaved: () => void;
  profile?: UserProfile;
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
        const body: UserProfileEdit = {
          name: input.name,
          bio: input.bio,
          photoUrl: input.photoUrl ?? null,
        };
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
      initialPhotoUrl={profile.photoUrl ?? null}
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
