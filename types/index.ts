export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number; // en kg
};

export type Session = {
  id: string;
  name: string;
  date: string; // ISO string
  exercises: Exercise[];
};

// Modèle d'entraînement réutilisable (sans date), à partir duquel on crée une séance.
export type Program = {
  id: string;
  name: string;
  exercises: Exercise[];
};
