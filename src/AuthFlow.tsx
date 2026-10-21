import { useState } from 'react';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';

export function AuthFlow({
  signIn,
  signUp,
}: {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    inviteCode?: string;
  }) => Promise<void>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return mode === 'login' ? (
    <LoginScreen onSubmit={signIn} onSwitch={() => setMode('register')} />
  ) : (
    <RegisterScreen onSubmit={signUp} onSwitch={() => setMode('login')} />
  );
}
