import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getAuthToken } from '../api/client';
import { updateUserProfile, type UserProfileEdit } from '../api/user';
import type { UserProfile } from '../api/types';
import { EditProfileForm, type EditProfileInput } from './EditProfileForm';
import { useProfile } from './useProfile';
import { useTheme } from '../common/theme';

// Cliente S3 direto para upload de avatar (bucket Railway / t3.storageapi.dev).
const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.EXPO_PUBLIC_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.EXPO_PUBLIC_S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.EXPO_PUBLIC_S3_SECRET_ACCESS_KEY ?? '',
  },
});

// Container da edição de perfil: carrega o perfil atual (ou usa o
// injetado), faz upload da foto para o S3 e o PUT /users/:id.
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
        let photoUrl = input.photoUrl;

        // Se o usuário selecionou uma foto local (file://), faz upload
        // direto para o S3 e usa a URL resultante no PUT.
        if (photoUrl && photoUrl.startsWith('file://')) {
          const ext = photoUrl.slice(photoUrl.lastIndexOf('.')).toLowerCase();
          const key = `uploads/avatar/${userId}/${Date.now()}${ext}`;
          const blobRes = await fetch(photoUrl);
          const blob = await blobRes.blob();

          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.EXPO_PUBLIC_S3_BUCKET ?? '',
              Key: key,
              Body: blob,
              ContentType:
                ext === '.heic' || ext === '.heif'
                  ? 'image/heic'
                  : ext === '.png'
                    ? 'image/png'
                    : 'image/jpeg',
            }),
          );
          photoUrl = `${process.env.EXPO_PUBLIC_S3_ENDPOINT ?? ''}/${process.env.EXPO_PUBLIC_S3_BUCKET ?? ''}/${key}`;
        }

        const body: UserProfileEdit = { name: input.name, bio: input.bio };
        if (photoUrl !== undefined) {
          body.photoUrl = photoUrl;
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
