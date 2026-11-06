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
import { Avatar } from '../common/Avatar';
import { pickPhoto } from '../compose/pickPhoto';
import {
  fonts,
  palette,
  radius,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { layout } from '../common/layout';

// Entrada de edição de perfil. Apresentação pura — quem salva é o
// EditProfileScreen (PUT /users/:id com photoUrl).
export type EditProfileInput = {
  name: string;
  bio: string | null;
  photoUrl?: string | null;
};

// Formulário de edição do próprio perfil: nome, bio e foto.
export function EditProfileForm({
  userId,
  initialName,
  initialBio,
  initialPhotoUrl,
  onPickPhoto,
  onSave,
  onBack,
  saving = false,
  error = null,
}: {
  userId: string;
  initialName: string;
  initialBio?: string | null;
  initialPhotoUrl?: string | null;
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
    initialPhotoUrl ? { uri: initialPhotoUrl } : null,
  );

  const canSave = name.trim() !== '' && !saving;

  const changePhoto = () => {
    void (onPickPhoto ?? pickPhoto)().then((src) => {
      if (src) {
        setPhoto(src);
      }
    });
  };

  const removePhoto = () => {
    setPhoto(null);
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
      photoUrl: uri ?? null,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View
        style={[
          layout.topbar,
          layout.divider,
          { borderBottomColor: t.line, justifyContent: 'space-between' },
        ]}
      >
        <Pressable
          testID="cancelar-perfil"
          onPress={onBack}
          hitSlop={6}
          style={layout.actionHit}
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
          <View
            testID="perfil-erro"
            style={[s.error, { backgroundColor: t.quietBg }]}
          >
            <Text style={[s.errorText, { color: t.sub }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingBottom: spacing.bloco },
  hbtn: { fontSize: type.body, fontFamily: fonts.corpo600, fontWeight: '600' },
  htitle: { fontFamily: fonts.display800, fontSize: type.bodyLarge },
  saveBtn: {
    borderRadius: radius.panel,
    paddingHorizontal: spacing.padrao,
    paddingVertical: spacing.interno,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: type.body,
  },
  photoBlock: {
    alignItems: 'center',
    gap: spacing.interno,
    paddingVertical: spacing.bloco - 4,
  },
  photoActions: { flexDirection: 'row', gap: spacing.padrao },
  link: { fontSize: type.body, fontFamily: fonts.corpo600, fontWeight: '600' },
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
    paddingVertical: spacing.medio,
    fontSize: type.bodyLarge,
    fontFamily: fonts.corpo,
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.padrao,
    minHeight: 44,
  },
  bioInput: { minHeight: 88, textAlignVertical: 'top' },
  error: {
    marginHorizontal: spacing.padrao,
    marginBottom: spacing.interno,
    borderRadius: radius.chip,
    padding: spacing.interno,
  },
  errorText: { fontSize: type.small },
});
