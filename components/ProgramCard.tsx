import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Program } from '../types';
import { colors, radius, spacing } from '../constants/theme';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

type Props = {
  program: Program;
  onPress: () => void;
  onDelete: () => void;
};

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Carte cliquable représentant un programme (modèle de séance réutilisable) :
 * nom et nombre d'exercices, avec suppression (bouton ou swipe, retour
 * haptique inclus). Pas de date ni de duplication, contrairement à `SessionCard`.
 * @param program - Le programme à afficher.
 * @param onPress - Callback déclenché au tap sur la carte (navigation).
 * @param onDelete - Callback déclenché à la suppression (bouton ou swipe).
 */
export function ProgramCard({ program, onPress, onDelete }: Props) {
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
          accessibilityLabel="Supprimer le programme"
        >
          <Ionicons name="trash-outline" size={20} color={colors.text} />
        </Pressable>
      )}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Programme ${program.name}`}
      >
        <View style={styles.content}>
          <Text style={styles.name}>{program.name}</Text>
          <Text style={styles.count}>
            {program.exercises.length} exercice{program.exercises.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer le programme"
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  count: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
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
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
});
