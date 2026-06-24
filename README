# RepLog 💪

Tracker de séances de musculation/sport — construit avec Expo (React Native).

## Stack

- **Expo** (SDK 51+, Managed Workflow)
- **TypeScript**
- **React Navigation** (Stack + Bottom Tabs)
- **AsyncStorage** pour la persistance locale
- **expo-haptics** pour le feedback tactile

## Structure du projet

```txt
replog/
├── app/                      # Écrans (Expo Router)
│   ├── (tabs)/
│   │   ├── index.tsx         # Accueil — liste des séances
│   │   └── history.tsx       # Historique complet
│   └── session/
│       └── [id].tsx          # Détail d'une séance
├── components/               # Composants réutilisables
│   ├── SessionCard.tsx
│   ├── ExerciseRow.tsx
│   └── AddExerciseModal.tsx
├── hooks/
│   └── useSessions.ts        # Hook custom — CRUD séances
├── types/
│   └── index.ts              # Types partagés
└── constants/
    └── theme.ts              # Couleurs, spacing, typo
```

## Fonctionnalités

- ✅ Créer une séance (nom + date automatique)
- ✅ Ajouter des exercices (nom, séries, reps, poids)
- ✅ Voir le détail d'une séance
- ✅ Supprimer une séance ou un exercice
- ✅ Historique persistant (AsyncStorage)
- ✅ Feedback haptique sur les actions

## Lancer le projet

```bash
# Installer les dépendances
npm install

# Lancer Expo
npx expo start
```

Scanne le QR code avec **Expo Go** (iOS / Android).

## Concepts Expo illustrés

| Concept | Où |
| --- | --- |
| Navigation Stack | `app/session/[id].tsx` |
| Bottom Tabs | `app/(tabs)/` |
| FlatList + rendu de liste | `app/(tabs)/index.tsx` |
| Modal | `components/AddExerciseModal.tsx` |
| AsyncStorage | `hooks/useSessions.ts` |
| Platform-specific styles | `constants/theme.ts` |
| Haptics | Actions de suppression |
