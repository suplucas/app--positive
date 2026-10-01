import { defineConfig, type Plugin } from "vitest/config";

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
  name: "test-stubs",
  load(id) {
    const path = id.replace(/\\/g, "/");
    if (path.endsWith("node_modules/react-native/index.js")) return rnStub;
    if (path.endsWith("node_modules/react-test-renderer/index.js"))
      return rtrStub;
    // expo-image-picker não roda em Node: stub que "cancela" o picker
    // (testes injetam o resultado via a seam `onPickPhoto`).
    if (path.includes("/expo-image-picker/"))
      return `export const launchImageLibraryAsync = async () => ({ canceled: true, assets: [] });`;
  },
};

export default defineConfig({
  plugins: [testStubs],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    server: { deps: { inline: ["react-native", "react-test-renderer"] } },
  },
});
