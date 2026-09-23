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

## Cenários de validação manual (spec §6)

| # | Ação | Esperado |
|---|------|----------|
| 1 | Abrir com `user_1` | ~20 cards |
| 2 | Scroll até o fim | próxima página |
| 3 | Pull-to-refresh | page 1 recarregado |
| 4 | Trocar para `mogli` | lista troca |
| 5 | FLUSHDB + refresh | cards do Postgres, sem erro |
| 6 | flush + 1 POST /reviews + refresh | poucos cards; próximo refresh mais completo (fill async) |
