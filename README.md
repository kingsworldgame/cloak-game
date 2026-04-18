# Cloak

Base inicial do app de investigacao criminal `Cloak`, com 5 telas principais, progressao em tempo real e preparacao para Supabase.

## Rodar local

```bash
npm install
npm run dev
```

## Stack

- React + TypeScript + Vite
- Supabase client preparado em `src/supabase.ts`
- SQL inicial em `supabase/schema.sql`

## Estrutura principal

- `src/App.tsx`: fluxo de telas e mecanicas principais
- `src/data.ts`: dados iniciais
- `src/storage.ts`: persistencia local
- `src/repository.ts`: persistencia remota (Supabase)
