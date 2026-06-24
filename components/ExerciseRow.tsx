import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Exercise } from '../types';
import { colors, spacing } from '../constants/theme';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

type Props = {
  exercise: Exercise;
  onDelete: () => void;
  /** Tap sur la ligne : ouvre l'édition de l'exercice. */
  onPress: () => void;
  /** Appui long sur la ligne : navigue vers les stats de l'exercice. */
  onLongPress: () => void;
};

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Affiche une ligne d'exercice avec son nom, ses séries/reps/poids, une
 * icône stats et un bouton de suppression (retour haptique inclus). Tap pour
 * modifier, icône ou appui long pour voir les stats, swipe pour supprimer
 * (en plus du bouton).
 * @param exercise - L'exercice à afficher.
 * @param onDelete - Callback déclenché lors de la suppression (bouton ou swipe).
 * @param onPress - Callback déclenché au tap (édition).
 * @param onLongPress - Callback déclenché à l'appui long ou à l'icône stats.
 */
export function ExerciseRow({ exercise, onDelete, onPress, onLongPress }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    onDelete();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={() => (
        <Pressable
          style={styles.swipeAction}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer l'exercice"
        >
          <Ionicons name="trash-outline" size={20} color={colors.text} />
        </Pressable>
      )}
    >
      <Pressable
        style={styles.row}
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityRole="button"
        accessibilityLabel={`Exercice ${exercise.name}`}
        accessibilityHint="Toucher pour modifier, appui long pour voir les statistiques"
      >
        <View style={styles.content}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.detail}>
            {exercise.sets} × {exercise.reps} — {exercise.weight} kg
          </Text>
        </View>
        <Pressable
          style={styles.statsButton}
          onPress={onLongPress}
          accessibilityRole="button"
          accessibilityLabel="Voir les statistiques de cet exercice"
        >
          <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer l'exercice"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 13,
  },
  statsButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeAction: {
    backgroundColor: colors.danger,
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
