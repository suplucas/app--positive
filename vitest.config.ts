import { defineConfig, type Plugin } from "vitest/config";

// Node/Vite can't parse react-native's Flow entry — serve a minimal stub instead.
const rnStub = `
import { createElement } from 'react';
const host = (name) => (props) => createElement(name, null, props.children);
export const View = host('View');
export const Text = host('Text');
export const StyleSheet = { create: (s) => s, hairlineWidth: 1 };
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
