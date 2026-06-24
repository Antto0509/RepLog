import type { Session } from '../types';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

/** Une occurrence d'un exercice donné dans l'historique des séances. */
export type ExerciseHistoryEntry = {
  date: string;
  sets: number;
  reps: number;
  weight: number;
};

/** ============================================================
 *  HELPERS
 * ============================================================ */

/** Normalise un nom d'exercice pour comparaison (espaces + casse). */
function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Calcule le volume total d'une séance (somme de séries × reps × poids sur
 * tous ses exercices).
 * @param session - La séance à mesurer.
 * @returns Le volume total en kg, `0` si la séance n'a aucun exercice.
 */
export function getSessionVolume(session: Session): number {
  return session.exercises.reduce((total, e) => total + e.sets * e.reps * e.weight, 0);
}

/**
 * Récupère l'historique d'un exercice (par nom, normalisé) à travers toutes
 * les séances, trié chronologiquement du plus ancien au plus récent.
 * @param sessions - Toutes les séances à parcourir.
 * @param exerciseName - Le nom de l'exercice recherché.
 * @returns La liste des occurrences, vide si aucune correspondance.
 */
export function getExerciseHistory(
  sessions: Session[],
  exerciseName: string
): ExerciseHistoryEntry[] {
  const target = normalizeExerciseName(exerciseName);

  const entries: ExerciseHistoryEntry[] = [];
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      if (normalizeExerciseName(exercise.name) === target) {
        entries.push({
          date: session.date,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
        });
      }
    }
  }

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Estime le 1RM (charge maximale sur une répétition) via la formule d'Epley,
 * arrondi au 0,5 kg le plus proche.
 * @param entry - Le poids et le nombre de reps d'une série.
 * @returns Le 1RM estimé en kg.
 */
export function getEstimated1RM(entry: { weight: number; reps: number }): number {
  const raw = entry.weight * (1 + entry.reps / 30);
  return Math.round(raw * 2) / 2;
}
