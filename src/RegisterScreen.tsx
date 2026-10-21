import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fonts, palette, spacing, useTheme } from './theme';

export function RegisterScreen({
  onSubmit,
  onSwitch,
}: {
  onSubmit: (input: {
    name: string;
    email: string;
    password: string;
    inviteCode?: string;
  }) => Promise<void>;
  onSwitch: () => void;
}) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        inviteCode: inviteCode.trim() || undefined,
      });
    } catch {
      setError('Não consegui criar a conta. Confira os dados e o convite.');
      setBusy(false);
    }
  };

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <Text style={[s.brand, { color: t.ink }]}>
        t<Text style={{ color: palette.lambeLambe }}>im</Text>
      </Text>
      <Text style={[s.title, { color: t.ink }]}>criar conta</Text>
      <TextInput
        testID="register-nome"
        value={name}
        onChangeText={setName}
        placeholder="nome"
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      <TextInput
        testID="register-email"
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      <TextInput
        testID="register-senha"
        value={password}
        onChangeText={setPassword}
        placeholder="senha (mín. 8)"
        secureTextEntry
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      <TextInput
        testID="register-convite"
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="código de convite"
        autoCapitalize="none"
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      {error ? (
        <Text testID="register-erro" style={[s.error, { color: palette.lambeLambe }]}>
          {error}
        </Text>
      ) : null}
      <Pressable
        testID="register-criar"
        onPress={() => void submit()}
        disabled={busy}
        style={[s.btn, { backgroundColor: palette.lambeLambe, opacity: busy ? 0.5 : 1 }]}
        accessibilityRole="button"
      >
        <Text style={s.btnText}>{busy ? 'criando…' : 'criar conta'}</Text>
      </Pressable>
      <Pressable testID="register-ir-login" onPress={onSwitch} hitSlop={8}>
        <Text style={[s.link, { color: t.sub }]}>já tenho conta</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.secao, gap: spacing.interno },
  brand: { fontFamily: fonts.display800, fontSize: 30, textAlign: 'center' },
  title: { fontFamily: fonts.display700, fontSize: 18, textAlign: 'center', marginBottom: spacing.interno },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: fonts.corpo,
  },
  error: { fontSize: 12.5 },
  btn: { borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: palette.papel, fontFamily: fonts.display700, fontSize: 14 },
  link: { textAlign: 'center', fontSize: 13, marginTop: spacing.interno },
});
