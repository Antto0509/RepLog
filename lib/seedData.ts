import * as Crypto from 'expo-crypto';
import type { Exercise, Program, Session } from '../types';

/** ============================================================
 *  HELPERS
 * ============================================================ */

/** Date ISO correspondant à `n` jours avant maintenant. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Construit un exercice avec un nouvel id. */
function exercise(name: string, sets: number, reps: number, weight: number): Exercise {
  return { id: Crypto.randomUUID(), name, sets, reps, weight };
}

/** ============================================================
 *  SEED
 * ============================================================ */

/**
 * Génère des séances de démonstration réparties sur les ~14 derniers jours,
 * avec une progression de poids visible sur "Développé couché" et "Squat"
 * (pour peupler le graphique et le 1RM estimé dès le premier lancement).
 * Dates calculées par rapport à maintenant à chaque appel — jamais figées.
 */
export function createSeedSessions(): Session[] {
  const sessions: Session[] = [
    {
      id: Crypto.randomUUID(),
      name: 'Push Day',
      date: daysAgo(14),
      exercises: [exercise('Développé couché', 4, 8, 60), exercise('Développé militaire', 3, 10, 40)],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Leg Day',
      date: daysAgo(10),
      exercises: [exercise('Squat', 4, 6, 80), exercise('Presse à cuisses', 3, 12, 120)],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Push Day',
      date: daysAgo(7),
      exercises: [
        exercise('Développé couché', 4, 8, 62.5),
        exercise('Développé militaire', 3, 10, 42.5),
      ],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Pull Day',
      date: daysAgo(5),
      exercises: [exercise('Tractions', 4, 8, 10), exercise('Rowing barre', 3, 10, 50)],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Push Day',
      date: daysAgo(3),
      exercises: [exercise('Développé couché', 4, 8, 65), exercise('Développé militaire', 3, 10, 45)],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Leg Day',
      date: daysAgo(1),
      exercises: [exercise('Squat', 4, 6, 85), exercise('Presse à cuisses', 3, 12, 130)],
    },
  ];

  // Plus récentes en premier, comme le reste de l'app.
  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Génère des programmes de démonstration correspondant aux séances ci-dessus,
 * pour illustrer le flux "créer une séance à partir d'un programme".
 */
export function createSeedPrograms(): Program[] {
  return [
    {
      id: Crypto.randomUUID(),
      name: 'Push Day',
      exercises: [exercise('Développé couché', 4, 8, 60), exercise('Développé militaire', 3, 10, 40)],
    },
    {
      id: Crypto.randomUUID(),
      name: 'Leg Day',
      exercises: [exercise('Squat', 4, 6, 80), exercise('Presse à cuisses', 3, 12, 120)],
    },
  ];
}
