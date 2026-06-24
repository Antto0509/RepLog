@AGENTS.md

# CLAUDE.md — RepLog

## Contexte projet

App mobile Expo (React Native + TypeScript) de tracking de séances de sport.
Développeur : Antoine (Reelium) — première app mobile, background Next.js/NestJS.

## Stack & versions

- Expo SDK 51 (Managed Workflow — pas de code natif custom)
- Expo Router v3 (file-based routing, comme Next.js App Router)
- React Navigation intégré via Expo Router
- AsyncStorage : `@react-native-async-storage/async-storage`
- TypeScript strict

## Règles absolues

### React Native ≠ Web

- PAS de `div`, `span`, `p` — utiliser `View`, `Text`, `ScrollView`
- PAS de CSS — utiliser `StyleSheet.create()`
- Tout texte DOIT être dans un composant `<Text>`
- Flexbox par défaut en colonne (`flexDirection: 'column'`)
- Toutes les valeurs numériques sont en **dp** (pas de `px`, `%` sauf exceptions)

### Expo Router

- Routing file-based dans `app/` (comme Next.js)
- `app/(tabs)/` = tab layout
- `app/session/[id].tsx` = route dynamique
- Navigation : `router.push()`, `router.back()`, `useLocalSearchParams()`

### Persistance

- Tout passe par `hooks/useSessions.ts`
- Pas d'état global externe (pas de Redux/Zustand) — Context API suffit
- AsyncStorage est asynchrone → toujours `async/await`

### Types — fichier `types/index.ts`

```ts
export type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  weight: number // en kg
}

export type Session = {
  id: string
  name: string
  date: string // ISO string
  exercises: Exercise[]
}
```

## Patterns à utiliser

### FlatList pour les listes (jamais ScrollView + map pour les longues listes)

```tsx
<FlatList
  data={sessions}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <SessionCard session={item} />}
  ListEmptyComponent={<EmptyState />}
/>
```

### KeyboardAvoidingView pour les formulaires

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
```

### Génération d'IDs

```ts
import { randomUUID } from 'expo-crypto'
const id = randomUUID()
```

## Thème (constants/theme.ts)

```ts
export const colors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  primary: '#E8FF47',   // jaune-vert vif — accent principal
  text: '#FFFFFF',
  textMuted: '#888888',
  danger: '#FF4757',
  border: '#2A2A2A',
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
export const radius = { sm: 8, md: 12, lg: 20 }
```

## Ce qu'on NE fait PAS

- Pas de backend / API — tout en local
- Pas de caméra, géoloc ou permissions
- Pas d'animations complexes (Reanimated hors scope)
- Pas de tests — prototype fonctionnel uniquement
