import { defineConfig, type Plugin } from 'vitest/config';

// Node/Vite can't parse react-native's Flow entry — serve a minimal stub instead.
const rnStub = `
import { createElement } from 'react';
const host = (name) => (props) => createElement(name, null, props.children);
export const View = host('View');
export const Text = host('Text');
export const Pressable = host('Pressable');
export const TextInput = host('TextInput');
export const ScrollView = host('ScrollView');
export const FlatList = host('FlatList');
export const RefreshControl = host('RefreshControl');
export const SafeAreaView = host('SafeAreaView');
export const Image = host('Image');
export const StyleSheet = { create: (s) => s, hairlineWidth: 1 };
export const useWindowDimensions = () => ({ width: 390, height: 844, scale: 2, fontScale: 1 });
// Animated mínimo p/ testes: timing resolve na hora, Value guarda o valor
// inicial e interpolate devolve um placeholder (o estilo animado não é
// inspecionado nos testes).
const makeTiming = () => ({ start: (cb) => cb && cb({ finished: true }), stop: () => {} });
class AnimValue { constructor(v) { this.v = v; } interpolate(cfg) { return this; } }
export const Animated = {
  View: host('AnimatedView'),
  Text: host('AnimatedText'),
  Value: AnimValue,
  timing: makeTiming,
  spring: makeTiming,
  decay: makeTiming,
};
export const Easing = { in: (x) => x, out: (x) => x, quad: { quad: true }, cubic: (x) => x, bezier: () => ({}) };
`;

// React 19 test-renderer renders asynchronously; flush bare create() via act
// so tests can read toJSON() synchronously.
const rtrStub = `
import * as real from 'react-test-renderer/cjs/react-test-renderer.development.js';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;
const realCreate = real.create;
export const act = real.act;
export function create(element, options) {
  let renderer;
  real.act(() => {
    renderer = realCreate(element, options);
  });
  return renderer;
}
export default real.default ?? real;
`;

const testStubs: Plugin = {
  name: 'test-stubs',
  load(id) {
    const path = id.replace(/\\/g, '/');
    if (path.endsWith('node_modules/react-native/index.js')) return rnStub;
    if (path.endsWith('node_modules/react-test-renderer/index.js'))
      return rtrStub;
    // expo-image-picker não roda em Node: stub que "cancela" o picker
    // (testes injetam o resultado via a seam `onPickPhoto`).
    if (path.includes('/expo-image-picker/'))
      return `export const launchImageLibraryAsync = async () => ({ canceled: true, assets: [] });`;
    // @aws-sdk/client-s3 não roda em Node de teste: stub leve (o upload
    // nunca é chamado nos testes de ComposeV2).
    if (path.includes('/@aws-sdk/client-s3/'))
      return `export class S3Client {} export class PutObjectCommand { constructor(input) { this.input = input; } }`;
    // expo-secure-store não roda em Node: stub em memória.
    if (path.includes('/expo-secure-store/'))
      return `const store = new Map();
export const getItemAsync = async (k) => store.get(k) ?? null;
export const setItemAsync = async (k, v) => { store.set(k, v); };
export const deleteItemAsync = async (k) => { store.delete(k); };`;
    // WebView é nativo: stub de host que preserva props p/ testar source
    // (HTML do mapa) e onMessage (ponte pin → restaurante).
    if (path.includes('/react-native-webview/'))
      return `import { createElement } from 'react';
export const WebView = (props) => createElement('WebView', props, props.children);`;
    // expo-linear-gradient é nativo: stub que preserva props/children p/
    // testar o scrim do FeedPhoto e o hero do PostDetail.
    if (path.includes('/expo-linear-gradient/'))
      return `import { createElement } from 'react';
export const LinearGradient = (props) => createElement('LinearGradient', props, props.children);`;
  },
};

export default defineConfig({
  plugins: [testStubs],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    server: { deps: { inline: ['react-native', 'react-test-renderer'] } },
  },
});
