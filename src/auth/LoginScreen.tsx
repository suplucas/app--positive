import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  fonts,
  palette,
  radius,
  spacing,
  type,
  useTheme,
} from '../common/theme';
import { friendlyAuthError } from './authError';

export function LoginScreen({
  onSubmit,
  onSwitch,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitch: () => void;
}) {
  const t = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password);
    } catch (e) {
      setError(friendlyAuthError(e, 'login'));
      setBusy(false);
    }
  };

  return (
    <View style={[s.wrap, { backgroundColor: t.bg }]}>
      <Text style={[s.brand, { color: t.ink }]}>
        t<Text style={{ color: palette.lambeLambe }}>im</Text>
      </Text>
      <Text style={[s.title, { color: t.ink }]}>entrar</Text>
      <TextInput
        testID="login-email"
        value={email}
        onChangeText={setEmail}
        placeholder="email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      <TextInput
        testID="login-senha"
        value={password}
        onChangeText={setPassword}
        placeholder="senha"
        secureTextEntry
        placeholderTextColor={t.sub}
        style={[s.input, { color: t.ink, borderColor: t.line }]}
      />
      {error ? (
        <Text
          testID="login-erro"
          style={[s.error, { color: palette.lambeLambe }]}
        >
          {error}
        </Text>
      ) : null}
      <Pressable
        testID="login-entrar"
        onPress={() => void submit()}
        disabled={busy}
        style={[
          s.btn,
          { backgroundColor: palette.lambeLambe, opacity: busy ? 0.5 : 1 },
        ]}
        accessibilityRole="button"
      >
        <Text style={s.btnText}>{busy ? 'entrando…' : 'entrar'}</Text>
      </Pressable>
      <Pressable testID="login-ir-cadastro" onPress={onSwitch} hitSlop={8}>
        <Text style={[s.link, { color: t.sub }]}>criar conta</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.secao,
    gap: spacing.interno,
  },
  brand: {
    fontFamily: fonts.display800,
    fontSize: type.hero,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.display700,
    fontSize: type.heading,
    textAlign: 'center',
    marginBottom: spacing.interno,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: spacing.padrao,
    paddingVertical: 12,
    fontSize: type.bodyLarge,
    fontFamily: fonts.corpo,
  },
  error: { fontSize: 12.5 },
  btn: {
    borderRadius: 14,
    paddingVertical: spacing.medio,
    alignItems: 'center',
  },
  btnText: {
    color: palette.papel,
    fontFamily: fonts.display700,
    fontSize: type.bodyLarge,
  },
  link: {
    textAlign: 'center',
    fontSize: type.body,
    marginTop: spacing.interno,
  },
});
