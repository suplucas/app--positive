import { describe, it, expect } from "vitest";
import { buildMapHtml } from "./mapHtml";
import { mapPlaces } from "./mapMock";

describe("buildMapHtml (mapa OSM/Leaflet)", () => {
  const places = mapPlaces();

  it("inclui um pin por lugar, com cnpj e nota", () => {
    const html = buildMapHtml({ places, mode: "light" });
    for (const p of places) {
      expect(html).toContain(p.cnpj);
      expect(html).toContain(p.nota.toFixed(1));
    }
  });

  it("sem key cai no OSM padrão (dev) com atribuição", () => {
    const html = buildMapHtml({ places, mode: "light" });
    expect(html).toContain("tile.openstreetmap.org");
    expect(html).toContain("OpenStreetMap");
    expect(html).not.toContain("api.maptiler.com");
  });

  it("com key usa MapTiler e credita OSM + MapTiler", () => {
    const html = buildMapHtml({
      places,
      mode: "light",
      tileKey: "chave-teste",
    });
    expect(html).toContain("api.maptiler.com/maps/backdrop-v4/256/");
    expect(html).toContain("key=chave-teste");
    expect(html).toContain("OpenStreetMap");
    expect(html).toContain("MapTiler");
  });

  it("ponte: toque no pin envia postMessage ao React Native", () => {
    const html = buildMapHtml({ places, mode: "light" });
    expect(html).toContain("ReactNativeWebView.postMessage");
    expect(html).toContain("open-restaurant");
  });

  it('mostra o ponto "você"', () => {
    const html = buildMapHtml({ places, mode: "light" });
    expect(html).toContain("voce");
  });

  it("tema escuro usa a variante dark do MapTiler", () => {
    const light = buildMapHtml({ places, mode: "light", tileKey: "k" });
    const dark = buildMapHtml({ places, mode: "dark", tileKey: "k" });
    expect(light).toContain("backdrop-v4/256");
    expect(dark).toContain("backdrop-v4-dark/256");
    expect(light).not.toBe(dark);
  });

  it("escapa nomes para não injetar HTML/script", () => {
    const html = buildMapHtml({
      places: [{ ...places[0]!, nome: "</script><script>alert(1)</script>" }],
      mode: "light",
    });
    expect(html).not.toContain("</script><script>alert(1)</script>");
  });
});
