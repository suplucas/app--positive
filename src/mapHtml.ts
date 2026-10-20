import { MAP_CENTER, type MapPlace } from "./mapMock";
import { palette } from "./theme";

// HTML do mapa (Leaflet + tiles OSM: MapTiler em produção, OSM padrão
// como fallback de dev) renderizado no WebView. Função pura de
// propósito: o layout/teste dos pins não depende do runtime nativo.
// Toque em pin → postMessage → onMessage no MapScreen.

export type MapThemeMode = "light" | "dark";

function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildMapHtml({
  places,
  mode,
  tileKey,
}: {
  places: MapPlace[];
  mode: MapThemeMode;
  tileKey?: string;
}): string {
  const dark = mode === "dark";
  const useMaptiler = Boolean(tileKey && tileKey.trim());
  const styleId = dark ? "backdrop-v4-dark" : "backdrop-v4";
  const key = tileKey?.trim();
  // Produção: MapTiler (OSM). Sem key, OSM padrão só para dev — a
  // política do OSM não cobre uso comercial/pesado.
  const tileUrl = useMaptiler
    ? `https://api.maptiler.com/maps/${styleId}/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key!)}`
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = useMaptiler
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const bg = dark ? "#121212" : palette.papel;
  const ink = dark ? "#F2F0EF" : palette.berinjela;
  const sub = dark ? "rgba(242,240,239,0.55)" : "rgba(36,26,34,0.58)";
  const line = dark ? "rgba(242,240,239,0.12)" : "rgba(36,26,34,0.12)";
  const attributionBg = dark ? "rgba(18,18,18,0.90)" : "rgba(251,242,228,0.94)";
  // Cartografia quieta: no claro, puxa para o papel; no escuro, só
  // reduz o contraste dos tiles escuros. Sem key (OSM claro), o modo
  // escuro inverte os tiles para não estourar a tela.
  const tileFilter = dark
    ? useMaptiler
      ? "saturate(0.8) brightness(0.95)"
      : "invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.65)"
    : "sepia(0.22) saturate(0.72) brightness(1.03) contrast(0.96)";

  const pins = places.map((p) => ({
    cnpj: p.cnpj,
    nome: p.nome,
    nota: p.nota.toFixed(1),
    cor: p.cor,
    // Contraste do número: tinta escura no mostarda, papel nos demais.
    text: p.cor === palette.mostarda ? palette.berinjela : palette.papel,
    lat: p.lat,
    lng: p.lng,
  }));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Instrument+Sans:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  :root { --bg:${bg}; --ink:${ink}; --sub:${sub}; --line:${line}; }
  html, body { height:100%; margin:0; background:var(--bg); }
  body { overflow:hidden; font-family:'Instrument Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  #map { position:absolute; inset:0; background:var(--bg); }
  .leaflet-container { background:var(--bg); font-family:inherit; }
  .leaflet-tile-pane { filter:${tileFilter}; }
  .pin-wrap { background:transparent; border:0; }
  .pin {
    width:38px; height:38px;
    border-radius:12px 12px 12px 2px;
    transform:rotate(-45deg);
    background:var(--c);
    display:flex; align-items:center; justify-content:center;
    border:2px solid rgba(251,242,228,0.92);
    box-shadow:0 6px 14px rgba(0,0,0,0.28);
  }
  .pin span {
    transform:rotate(45deg);
    font-family:'Bricolage Grotesque',system-ui,sans-serif;
    font-weight:800; font-size:12px; line-height:1;
    color:var(--ink-pin);
  }
  .voce {
    width:22px; height:22px; box-sizing:border-box;
    border-radius:50%;
    background:var(--ink);
    border:4px solid var(--bg);
    box-shadow:0 0 0 6px rgba(36,26,34,0.14), 0 4px 12px rgba(0,0,0,0.25);
  }
  .leaflet-control-attribution {
    background:${attributionBg} !important;
    color:${ink} !important;
    font-size:10px; line-height:1.4;
    padding:3px 8px; border-radius:999px;
    box-shadow:0 2px 8px rgba(0,0,0,0.12);
    margin:10px !important;
  }
  .leaflet-control-attribution a { color:${palette.lambeLambe} !important; }
  .leaflet-control-zoom { display:none; }
  .fallback {
    height:100%; display:flex; align-items:center; justify-content:center;
    color:var(--sub); font-size:13px; text-align:center; padding:24px;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var places = ${jsonForScript(pins)};
  var center = ${jsonForScript(MAP_CENTER)};

  function post(message) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  function init() {
    if (!window.L) {
      document.body.innerHTML =
        '<div class="fallback">mapa indisponível sem conexão.</div>';
      return;
    }

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    L.control.attribution({ position: 'topright', prefix: false })
      .addTo(map)
      .addAttribution(${jsonForScript(attribution)});

    L.tileLayer(${jsonForScript(tileUrl)}, {
      maxZoom: 19,
      detectRetina: false,
    }).addTo(map);

    var points = [[center.lat, center.lng]];

    places.forEach(function (p) {
      points.push([p.lat, p.lng]);
      var icon = L.divIcon({
        className: 'pin-wrap',
        html:
          '<div class="pin" style="--c:' + p.cor + ';--ink-pin:' + p.text + '">' +
          '<span>' + p.nota + '</span></div>',
        iconSize: [38, 38],
        iconAnchor: [19, 45],
      });
      L.marker([p.lat, p.lng], { icon: icon, title: p.nome, keyboard: false })
        .on('click', function () {
          post({ type: 'open-restaurant', cnpj: p.cnpj });
        })
        .addTo(map);
    });

    L.marker([center.lat, center.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div class="voce"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(points), {
      // Reserva topo (chip) e rodapé (bottom sheet) para nenhum pin
      // nascer escondido atrás da folha.
      paddingTopLeft: [44, 76],
      paddingBottomRight: [44, 224],
      maxZoom: 15,
    });
    map.invalidateSize();
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
</script>
</body>
</html>`;
}
