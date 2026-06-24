import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Exercise, Program } from '../types';
import { createSeedPrograms } from '../lib/seedData';

const STORAGE_KEY = 'replog_programs';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

/** Valeur exposée par `usePrograms()` / `useProgramsContext()`. */
type ProgramsContextValue = ReturnType<typeof usePrograms>;

/** ============================================================
 *  HOOK
 * ============================================================ */

/**
 * Hook de persistance des programmes (modèles de séances réutilisables, sans
 * date). Même pattern que `useSessions` : charge au montage, réécrit la
 * liste complète à chaque mutation (find → replace → persist).
 *
 * Comme pour les séances, utiliser `useProgramsContext()` (via
 * `ProgramsProvider`) plutôt que ce hook directement, pour partager une
 * seule source de vérité entre écrans.
 */
export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Chargement initial depuis AsyncStorage. Si la clé n'a jamais été écrite
   * (`raw === null`, premier lancement de l'app), on pré-remplit avec des
   * programmes de démonstration — uniquement dans ce cas précis, pas si la
   * liste est simplement vide après une suppression volontaire.
   */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          setPrograms(JSON.parse(raw) as Program[]);
        } else {
          const seeded = createSeedPrograms();
          setPrograms(seeded);
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
  const persist = useCallback(async (next: Program[]) => {
    setPrograms(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  /**
   * Crée un nouveau programme vide et l'ajoute en tête de liste.
   * @param name - Nom du programme.
   * @returns L'id du programme créé.
   */
  const addProgram = useCallback(
    async (name: string): Promise<string> => {
      const newProgram: Program = { id: Crypto.randomUUID(), name, exercises: [] };
      await persist([newProgram, ...programs]);
      return newProgram.id;
    },
    [programs, persist]
  );

  /**
   * Supprime un programme par id.
   * @param id - Identifiant du programme à supprimer.
   */
  const deleteProgram = useCallback(
    async (id: string) => {
      await persist(programs.filter((p) => p.id !== id));
    },
    [programs, persist]
  );

  /**
   * Renomme un programme existant.
   * @param id - Identifiant du programme cible.
   * @param name - Nouveau nom.
   */
  const updateProgramName = useCallback(
    async (id: string, name: string) => {
      await persist(programs.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [programs, persist]
  );

  /**
   * Ajoute un exercice à un programme existant.
   * @param programId - L'identifiant du programme cible.
   * @param exercise - Les données de l'exercice sans l'id (généré automatiquement).
   */
  const addExerciseToProgram = useCallback(
    async (programId: string, exercise: Omit<Exercise, 'id'>) => {
      const newExercise: Exercise = { id: Crypto.randomUUID(), ...exercise };
      await persist(
        programs.map((p) =>
          p.id === programId ? { ...p, exercises: [...p.exercises, newExercise] } : p
        )
      );
    },
    [programs, persist]
  );

  /**
   * Met à jour un exercice d'un programme (nom/séries/reps/poids), id inchangé.
   * @param programId - L'identifiant du programme cible.
   * @param exerciseId - L'identifiant de l'exercice à modifier.
   * @param updates - Les nouvelles valeurs de l'exercice.
   */
  const updateExerciseInProgram = useCallback(
    async (programId: string, exerciseId: string, updates: Omit<Exercise, 'id'>) => {
      await persist(
        programs.map((p) =>
          p.id === programId
            ? {
                ...p,
                exercises: p.exercises.map((e) =>
                  e.id === exerciseId ? { id: e.id, ...updates } : e
                ),
              }
            : p
        )
      );
    },
    [programs, persist]
  );

  /**
   * Supprime un exercice d'un programme.
   * @param programId - L'identifiant du programme cible.
   * @param exerciseId - L'identifiant de l'exercice à supprimer.
   */
  const deleteExerciseFromProgram = useCallback(
    async (programId: string, exerciseId: string) => {
      await persist(
        programs.map((p) =>
          p.id === programId
            ? { ...p, exercises: p.exercises.filter((e) => e.id !== exerciseId) }
            : p
        )
      );
    },
    [programs, persist]
  );

  /**
   * Réinitialise les programmes avec les données de démo (utilitaire de
   * dev/démo, cf. `lib/seedData.ts`) — réécrit l'état et AsyncStorage
   * immédiatement, sans attendre un redémarrage de l'app.
   */
  const resetToDemoData = useCallback(async () => {
    await persist(createSeedPrograms());
  }, [persist]);

  return {
    programs,
    isLoaded,
    addProgram,
    deleteProgram,
    updateProgramName,
    addExerciseToProgram,
    updateExerciseInProgram,
    deleteExerciseFromProgram,
    resetToDemoData,
  };
}

/** ============================================================
 *  CONTEXT
 * ============================================================ */

const ProgramsContext = createContext<ProgramsContextValue | null>(null);

/**
 * Fournit une instance partagée de `usePrograms()` à toute l'arborescence
 * englobée, pour que tous les écrans restent synchronisés sur la même liste
 * de programmes.
 */
export function ProgramsProvider({ children }: { children: ReactNode }) {
  const value = usePrograms();
  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>;
}

/**
 * Accède à l'instance partagée de programmes fournie par `ProgramsProvider`.
 * Lève une erreur si appelé hors de son arbre.
 */
export function useProgramsContext(): ProgramsContextValue {
  const ctx = useContext(ProgramsContext);
  if (!ctx) {
    throw new Error('useProgramsContext must be used within a ProgramsProvider');
  }
  return ctx;
}
