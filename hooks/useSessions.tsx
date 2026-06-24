import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Exercise, Session } from '../types';
import { createSeedSessions } from '../lib/seedData';

const STORAGE_KEY = 'replog_sessions';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

/** Valeur exposée par `useSessions()` / `useSessionsContext()`. */
type SessionsContextValue = ReturnType<typeof useSessions>;

/** ============================================================
 *  HOOK
 * ============================================================ */

/**
 * Hook de persistance des séances. Charge les séances depuis AsyncStorage au
 * montage, et expose les opérations CRUD qui réécrivent la liste complète à
 * chaque mutation (find → replace → persist).
 *
 * Ne pas appeler directement depuis plusieurs écrans : chaque appel crée son
 * propre état local déconnecté des autres. Utiliser `useSessionsContext()`
 * (via `SessionsProvider`) pour partager une seule source de vérité.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Chargement initial depuis AsyncStorage. Si la clé n'a jamais été écrite
   * (`raw === null`, premier lancement de l'app), on pré-remplit avec des
   * séances de démonstration — uniquement dans ce cas précis, pas si la liste
   * est simplement vide après une suppression volontaire de l'utilisateur.
   */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          setSessions(JSON.parse(raw) as Session[]);
        } else {
          const seeded = createSeedSessions();
          setSessions(seeded);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        }
      } catch {
        // données corrompues — on repart d'une liste vide
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  /** Réécrit l'état local et AsyncStorage avec la nouvelle liste complète. */
  const persist = useCallback(async (next: Session[]) => {
    setSessions(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /**
   * Crée une nouvelle séance vide, datée à maintenant, et l'ajoute en tête de liste.
   * @param name - Nom de la séance.
   */
  const addSession = useCallback(
    async (name: string) => {
      const newSession: Session = {
        id: Crypto.randomUUID(),
        name,
        date: new Date().toISOString(),
        exercises: [],
      };
      await persist([newSession, ...sessions]);
    },
    [sessions, persist]
  );

  /**
   * Supprime une séance par id.
   * @param id - Identifiant de la séance à supprimer.
   */
  const deleteSession = useCallback(
    async (id: string) => {
      await persist(sessions.filter((s) => s.id !== id));
    },
    [sessions, persist]
  );

  /**
   * Renomme une séance existante.
   * @param id - Identifiant de la séance cible.
   * @param name - Nouveau nom.
   */
  const updateSessionName = useCallback(
    async (id: string, name: string) => {
      await persist(sessions.map((s) => (s.id === id ? { ...s, name } : s)));
    },
    [sessions, persist]
  );

  /**
   * Ajoute un exercice à une séance existante.
   * @param sessionId - L'identifiant de la séance cible.
   * @param exercise - Les données de l'exercice sans l'id (généré automatiquement).
   */
  const addExercise = useCallback(
    async (sessionId: string, exercise: Omit<Exercise, 'id'>) => {
      const newExercise: Exercise = { id: Crypto.randomUUID(), ...exercise };
      await persist(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, exercises: [...s.exercises, newExercise] } : s
        )
      );
    },
    [sessions, persist]
  );

  /**
   * Supprime un exercice d'une séance.
   * @param sessionId - L'identifiant de la séance cible.
   * @param exerciseId - L'identifiant de l'exercice à supprimer.
   */
  const deleteExercise = useCallback(
    async (sessionId: string, exerciseId: string) => {
      await persist(
        sessions.map((s) =>
          s.id === sessionId
            ? { ...s, exercises: s.exercises.filter((e) => e.id !== exerciseId) }
            : s
        )
      );
    },
    [sessions, persist]
  );

  /**
   * Met à jour un exercice existant (nom/séries/reps/poids), id inchangé.
   * @param sessionId - L'identifiant de la séance cible.
   * @param exerciseId - L'identifiant de l'exercice à modifier.
   * @param updates - Les nouvelles valeurs de l'exercice.
   */
  const updateExercise = useCallback(
    async (sessionId: string, exerciseId: string, updates: Omit<Exercise, 'id'>) => {
      await persist(
        sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises.map((e) =>
                  e.id === exerciseId ? { id: e.id, ...updates } : e
                ),
              }
            : s
        )
      );
    },
    [sessions, persist]
  );

  /**
   * Duplique une séance existante : nouvelle séance datée à maintenant, nom
   * suffixé "(copie)", exercices clonés avec de nouveaux ids.
   * @param id - Identifiant de la séance source.
   * @returns L'id de la nouvelle séance, ou `null` si la source n'existe pas.
   */
  const duplicateSession = useCallback(
    async (id: string): Promise<string | null> => {
      const source = sessions.find((s) => s.id === id);
      if (!source) return null;

      const newSession: Session = {
        id: Crypto.randomUUID(),
        name: `${source.name} (copie)`,
        date: new Date().toISOString(),
        exercises: source.exercises.map((e) => ({ ...e, id: Crypto.randomUUID() })),
      };
      await persist([newSession, ...sessions]);
      return newSession.id;
    },
    [sessions, persist]
  );

  /**
   * Crée une nouvelle séance à partir d'un nom et d'une liste d'exercices
   * (typiquement issus d'un programme), chaque exercice recevant un nouvel id.
   * Ne dépend pas du type `Program` pour rester découplé de `usePrograms`.
   * @param name - Nom de la nouvelle séance.
   * @param exercises - Exercices à cloner dans la séance.
   * @returns L'id de la nouvelle séance.
   */
  const createSessionFromProgram = useCallback(
    async (name: string, exercises: Omit<Exercise, 'id'>[]): Promise<string | null> => {
      const newSession: Session = {
        id: Crypto.randomUUID(),
        name,
        date: new Date().toISOString(),
        exercises: exercises.map((e) => ({ id: Crypto.randomUUID(), ...e })),
      };
      await persist([newSession, ...sessions]);
      return newSession.id;
    },
    [sessions, persist]
  );

  /**
   * Réinitialise les séances avec les données de démo (utilitaire de dev/démo,
   * cf. `lib/seedData.ts`) — réécrit l'état et AsyncStorage immédiatement,
   * sans attendre un redémarrage de l'app.
   */
  const resetToDemoData = useCallback(async () => {
    await persist(createSeedSessions());
  }, [persist]);

  return {
    sessions,
    isLoaded,
    addSession,
    deleteSession,
    updateSessionName,
    addExercise,
    deleteExercise,
    updateExercise,
    duplicateSession,
    createSessionFromProgram,
    resetToDemoData,
  };
}

/** ============================================================
 *  CONTEXT
 * ============================================================ */

const SessionsContext = createContext<SessionsContextValue | null>(null);

/**
 * Fournit une instance partagée de `useSessions()` à toute l'arborescence
 * englobée, pour que tous les écrans restent synchronisés sur la même liste
 * de séances (créer/supprimer depuis un écran se reflète partout sans remount).
 */
export function SessionsProvider({ children }: { children: ReactNode }) {
  const value = useSessions();
  return <SessionsContext.Provider value={value}>{children}</SessionsContext.Provider>;
}

/**
 * Accède à l'instance partagée de séances fournie par `SessionsProvider`.
 * Lève une erreur si appelé hors de son arbre.
 */
export function useSessionsContext(): SessionsContextValue {
  const ctx = useContext(SessionsContext);
  if (!ctx) {
    throw new Error('useSessionsContext must be used within a SessionsProvider');
  }
  return ctx;
}
