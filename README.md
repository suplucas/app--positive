# app--positive

Expo mínimo para validar `GET /feed` (ver spec em `../docs/superpowers/specs/2026-09-22-mobile-feed-app-design.md`).

## Rodar

```bash
npm install
# API de pé na porta 3001
EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start
# Android emulador: EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
# Celular real (Expo Go): EXPO_PUBLIC_API_URL=http://<IP-da-LAN>:3001
```

Cenários manuais: spec §6.
