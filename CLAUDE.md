@AGENTS.md

# CLAUDE.md — RepLog

## Contexte projet

App mobile Expo (React Native + TypeScript) de tracking de séances de sport.
Développeur : Antoine (Reelium) — première app mobile, background Next.js/NestJS.

## Stack & versions

- Expo SDK 54 (Managed Workflow — pas de code natif custom)
- Expo Router v6 (file-based routing, comme Next.js App Router)
- React Navigation intégré via Expo Router
- AsyncStorage : `@react-native-async-storage/async-storage`
- TypeScript strict

## Workflow obligatoire

Avant tout développement, Claude suit impérativement ces 4 étapes :

### 1. Analyse

- Lire les fichiers existants concernés par la demande avant d'écrire la moindre ligne
- Évaluer la complexité : impact sur d'autres fichiers, risques de régression, dépendances
- Si la demande est ambiguë, poser UNE question ciblée plutôt que de supposer

### 2. Plan

- Proposer un plan clair : fichiers créés / modifiés, ordre d'implémentation, choix techniques
- Attendre la validation explicite avant de coder ("go", "ok", "valide"...)
- Pour les tâches simples (< 3 fichiers, risque faible), le plan peut être court — une liste suffit

### 3. Développement

- Implémenter uniquement ce qui a été validé, pas plus
- Un commit logique par étape si le projet est versionné

### 4. Review

- Après implémentation, faire une relecture critique : cohérence avec l'existant, cas limites oubliés, dette technique introduite
- Signaler explicitement ce qui reste à faire ou ce qui pourrait poser problème plus tard

---

## Documentation vivante

Ce fichier CLAUDE.md est la source de vérité du projet. Claude le met à jour automatiquement dès qu'un de ces éléments change :

- Nouveau composant ou hook créé → l'ajouter dans la structure
- Nouveau pattern adopté → l'ajouter dans "Patterns à utiliser"
- Décision technique prise → l'ajouter avec une courte justification
- Contrainte découverte → l'ajouter dans "Règles absolues" ou "Ce qu'on NE fait PAS"

Chaque mise à jour du CLAUDE.md doit être mentionnée explicitement dans la réponse ("J'ai mis à jour CLAUDE.md : ...").

---

## Style de code

### Commentaires JSDoc

Chaque fonction, hook, et composant doit être commenté en JSDoc :

```ts
/**
 * Ajoute un exercice à une séance existante.
 * @param sessionId - L'identifiant de la séance cible
 * @param exercise - Les données de l'exercice sans l'id (généré automatiquement)
 */
async function addExercise(sessionId: string, exercise: Omit<Exercise, 'id'>): Promise<void> { ... }
```

```tsx
/**
 * Affiche une ligne d'exercice avec son nom, ses séries/reps/poids et un bouton de suppression.
 * @param exercise - L'exercice à afficher
 * @param onDelete - Callback déclenché lors de la suppression
 */
export function ExerciseRow({ exercise, onDelete }: ExerciseRowProps) { ... }
```

### Régions

Chaque fichier est organisé en régions explicites avec des blocs `/** */` :

```ts
/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

/** ============================================================
 *  STATE & REFS
 * ============================================================ */

/** ============================================================
 *  HANDLERS
 * ============================================================ */

/** ============================================================
 *  EFFECTS
 * ============================================================ */

/** ============================================================
 *  RENDER
 * ============================================================ */
```

Les régions s'adaptent au contenu du fichier — ne pas créer une région vide pour le principe.

---

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
- Mutateurs disponibles : `addSession`, `deleteSession`, `updateSessionName`, `addExercise`, `deleteExercise`, `updateExercise`, `duplicateSession` (retourne l'id de la copie, ou `null` si la séance source n'existe pas), `createSessionFromProgram(name, exercises)` (retourne l'id de la nouvelle séance ; prend des données brutes plutôt qu'un `Program` pour ne pas dépendre de `usePrograms`)

### Programmes (`hooks/usePrograms.tsx`)

Modèles de séances réutilisables, sans date — même pattern que `useSessions` (Provider/Context, AsyncStorage, `find → replace → persist`), clé AsyncStorage `replog_programs`. Mutateurs : `addProgram` (retourne l'id, l'écran navigue immédiatement vers le détail), `deleteProgram`, `updateProgramName`, `addExerciseToProgram`, `updateExerciseInProgram`, `deleteExerciseFromProgram`. Pour créer une séance à partir d'un programme, l'écran appelle `createSessionFromProgram` de `useSessions` (pas de méthode dans `usePrograms` elle-même, pour éviter une dépendance circulaire entre les deux hooks).

### Routes (`app/`)

- `app/(tabs)/index.tsx` (Séances), `app/(tabs)/history.tsx` (Historique), `app/(tabs)/programs.tsx` (Programmes), `app/session/[id].tsx` (détail séance), `app/program/[id].tsx` (détail programme, mêmes interactions que le détail séance mais sans volume/minuteur), `app/exercise/[name].tsx` (1RM estimé, graphique et historique d'un exercice à travers les séances, lecture seule)

### Limitations connues

- Le minuteur de repos (`app/session/[id].tsx`) utilise `setInterval` ; il peut être ralenti par l'OS si l'app passe en arrière-plan pendant le décompte — accepté comme limitation, pas de fix prévu (cohérent avec "pas d'animations complexes").

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

// Modèle d'entraînement réutilisable (sans date), à partir duquel on crée une séance.
export type Program = {
  id: string
  name: string
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

### Bouton d'action dans le header natif d'un tab

Le header natif (`Tabs`/`Stack`) est statique et défini dans le `_layout.tsx` — il n'a pas accès à l'état local d'un écran. Pour y placer un bouton qui déclenche une action propre à l'écran (ex: "+" qui ouvre un formulaire), l'écran injecte son propre `headerRight` via `useNavigation().setOptions(...)` dans un `useEffect` :

```tsx
const navigation = useNavigation();

useEffect(() => {
  navigation.setOptions({
    headerRight: () => <Pressable onPress={handleAddPress}>...</Pressable>,
  });
}, [navigation, handleAddPress]);
```

Évite d'avoir un header custom en plus du header natif (risque de titre dupliqué) — un seul header, natif, pour tout l'écran. Utilisé dans `app/(tabs)/index.tsx` et `app/session/[id].tsx` (bouton de duplication).

### Swipe-to-delete

`react-native-gesture-handler` est utilisé pour le swipe-to-delete sur `SessionCard` et `ExerciseRow` (composant `Swipeable`, `renderRightActions`). Ce composant s'appuie sur l'API `Animated` historique, pas Reanimated — ne contredit donc pas "pas d'animations complexes (Reanimated hors scope)". Nécessite que `app/_layout.tsx` englobe tout dans `GestureHandlerRootView` (le plus haut possible dans l'arbre). Le swipe **complète** le bouton corbeille existant, il ne le remplace pas — les deux déclenchent le même handler de suppression (Haptics Medium inclus).

### Tap pour éditer / icône stats / appui long (`ExerciseRow`)

Tap sur la ligne → ouvre `AddExerciseModal` en mode édition. Pour les stats (`/exercise/[name]`), deux déclencheurs équivalents : l'icône `stats-chart-outline` (visible, accessible) et l'appui long sur la ligne (raccourci, conservé pour les habitués). L'appui long seul n'était pas assez découvrable — l'icône a été ajoutée après coup suite à ce retour.

### Calculs purs dans `lib/`

Les fonctions de calcul sans état ni effet (ex: stats) vivent dans `lib/`, séparées des composants et du hook de persistance — `lib/stats.ts` est le premier fichier de ce dossier (`getSessionVolume`, `getExerciseHistory`).

### Presets dans `constants/`

`constants/exercisePresets.ts` exporte `EXERCISE_PRESETS`, une liste de noms d'exercices courants proposés en chips dans `AddExerciseModal` (mode création uniquement) pour accélérer la saisie.

### `AddExerciseModal` : création et édition

Le même modal gère la création et la modification d'un exercice (pas de composant dédié séparé) : prop optionnelle `editingExercise` change le titre/bouton et pré-remplit les champs (resynchronisés via un `useEffect` à chaque changement de `editingExercise`). Le callback s'appelle `onSubmit` (pas `onAdd`) puisqu'il couvre les deux cas. Réutilisé tel quel par `app/program/[id].tsx` (les exercices d'un programme sont des `Exercise` standards, juste sans date associée).

### Données de démo au premier lancement

`lib/seedData.ts` exporte `createSeedSessions()`/`createSeedPrograms()` (fonctions, pas des constantes statiques — dates calculées par rapport à `now()` à chaque appel, ids fraîchement générés). `hooks/useSessions.tsx` et `hooks/usePrograms.tsx` les utilisent dans leur effet de chargement, **uniquement quand `AsyncStorage.getItem(STORAGE_KEY)` renvoie `null`** (clé jamais écrite, premier lancement réel) — surtout pas quand la liste est simplement vide après une suppression volontaire, sinon vider ses données ferait réapparaître les données de démo. Ne pas changer cette condition en `liste.length === 0`.

Les deux hooks exposent aussi `resetToDemoData()` (réécrit état + AsyncStorage avec les données seed, sans attendre un redémarrage), déclenché depuis un bouton discret "Réinitialiser les données de démo" en bas de l'onglet Programmes (`app/(tabs)/programs.tsx`), avec confirmation via `Alert.alert`. Utilitaire de dev/démo uniquement — pas une fonctionnalité destinée à l'utilisateur final.

### Graphique sans librairie de charting

`app/exercise/[name].tsx` affiche un graphique de progression du poids en barres avec des `View` simples (hauteur proportionnelle à `poids / poids max`, hauteur minimale ~4dp pour rester visible), dans un `FlatList` horizontal. Pas de dépendance de charting, pas de Reanimated — cohérent avec "pas d'animations complexes". Pattern à réutiliser si d'autres graphiques sont ajoutés plus tard.

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
