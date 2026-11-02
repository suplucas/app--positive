import { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from './Avatar';
import { pickPhoto } from './pickPhoto';
import { friendlyApiError } from './format';
import { fonts, palette, spacing, useTheme } from './theme';

// Entrada de edição de perfil. `photoUri` undefined = manter a foto
// atual; null = remover; string = nova foto local (o container faz upload).
export type EditProfileInput = {
  name: string;
  bio: string | null;
  photoUri?: string | null;
};

// Formulário de edição do próprio perfil: nome, bio e foto. Apresentação
// pura — quem salva (upload + PUT) é o EditProfileScreen.
export function EditProfileForm({
  userId,
  initialName,
  initialBio,
  initialPhotoUri,
  onPickPhoto,
  onSave,
  onBack,
  saving = false,
  error = null,
}: {
  userId: string;
  initialName: string;
  initialBio?: string | null;
  initialPhotoUri?: string | null;
  // Seam p/ testes injetarem a galeria sem tocar no native.
  onPickPhoto?: () => Promise<ImageSourcePropType | null>;
  onSave: (input: EditProfileInput) => void;
  onBack: () => void;
  saving?: boolean;
  error?: string | null;
}) {
  const t = useTheme();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio ?? '');
  const [photo, setPhoto] = useState<ImageSourcePropType | null>(
    initialPhotoUri ? { uri: initialPhotoUri } : null,
  );
  const [photoTouched, setPhotoTouched] = useState(false);

  const canSave = name.trim() !== '' && !saving;

  const changePhoto = () => {
    void (onPickPhoto ?? pickPhoto)().then((src) => {
      if (src) {
        setPhoto(src);
        setPhotoTouched(true);
      }
    });
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoTouched(true);
  };

  const submit = () => {
    if (!canSave) return;
    const uri =
      photo && typeof photo === 'object' && 'uri' in photo
        ? (photo as { uri?: string }).uri
        : undefined;
    onSave({
      name: name.trim(),
      bio: bio.trim() === '' ? null : bio.trim(),
      ...(photoTouched ? { photoUri: uri ?? null } : {}),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={[s.subHeader, { borderBottomColor: t.line }]}>
        <Pressable
          testID="cancelar-perfil"
          onPress={onBack}
          hitSlop={6}
          accessibilityRole="button"
        >
          <Text style={[s.hbtn, { color: t.sub }]}>cancelar</Text>
        </Pressable>
        <Text style={[s.htitle, { color: t.ink }]}>editar perfil</Text>
        <Pressable
          testID="salvar-perfil"
          onPress={submit}
          disabled={!canSave}
          style={[
            s.saveBtn,
            { backgroundColor: palette.lambeLambe, opacity: canSave ? 1 : 0.4 },
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: saving }}
        >
          <Text style={s.saveBtnText}>{saving ? 'salvando…' : 'salvar'}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.photoBlock}>
          <Avatar userId={userId} size={88} photo={photo ?? undefined} />
          <View style={s.photoActions}>
            <Pressable
              testID="trocar-foto"
              onPress={changePhoto}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="trocar foto de perfil"
            >
              <Text style={[s.link, { color: palette.lambeLambe }]}>
                {photo ? 'trocar foto' : 'adicionar foto'}
              </Text>
            </Pressable>
            {photo ? (
              <Pressable
                testID="remover-foto"
                onPress={removePhoto}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="remover foto de perfil"
              >
                <Text style={[s.link, { color: t.sub }]}>remover</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={[s.label, { color: t.sub }]}>nome</Text>
        <TextInput
          testID="perfil-nome"
          value={name}
          onChangeText={setName}
          placeholder="seu nome"
          placeholderTextColor={t.sub}
          autoCapitalize="words"
          style={[s.input, { backgroundColor: t.quietBg, color: t.ink }]}
          accessibilityLabel="nome"
        />

        <Text style={[s.label, { color: t.sub }]}>bio</Text>
        <TextInput
          testID="perfil-bio"
          value={bio}
          onChangeText={setBio}
          placeholder="conte o que você gosta de comer"
          placeholderTextColor={t.sub}
          multiline
          style={[
            s.input,
            s.bioInput,
            { backgroundColor: t.quietBg, color: t.ink },
          ]}
          accessibilityLabel="bio"
        />

        {error ? (
          <View testID="perfil-erro" style={[s.error, { backgroundColor: t.quietBg }]}>
            <Text style={[s.errorText, { color: t.sub }]}>
              {friendlyApiError(error, 'publish')}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.padrao - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hbtn: { fontSize: 13, fontFamily: fonts.corpo600, fontWeight: '600' },
  htitle: { fontFamily: fonts.display800, fontSize: 14 },
  saveBtn: {
    borderRadius: 16,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 7,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: 13,
  },
  photoBlock: {
    alignItems: 'center',
    gap: spacing.interno,
    paddingVertical: spacing.bloco - 4,
  },
  photoActions: { flexDirection: 'row', gap: spacing.padrao },
  link: { fontSize: 13, fontFamily: fonts.corpo600, fontWeight: '600' },
  label: {
    fontFamily: fonts.display700,
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 0.03,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
  },
  input: {
    borderRadius: 6,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno + 4,
    fontSize: 14,
    fontFamily: fonts.corpo,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.padrao,
    minHeight: 44,
  },
  bioInput: { minHeight: 88, textAlignVertical: 'top' },
  error: {
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    borderRadius: 5,
    padding: spacing.interno,
  },
  errorText: { fontSize: 12 },
});
