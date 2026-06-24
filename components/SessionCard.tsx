import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Session } from '../types';
import { colors, radius, spacing } from '../constants/theme';

const DAYS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/**
 * Formate une date ISO en court format FR sans dépendance externe.
 * @param iso - Date ISO de la séance.
 * @returns Chaîne du type "Lun. 23 juin".
 */
export function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

type Props = {
  session: Session;
  onPress: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Carte cliquable représentant une séance : nom, date formatée et nombre
 * d'exercices, avec des boutons de duplication et de suppression (retour
 * haptique sur la suppression). Swipe pour supprimer (en plus du bouton).
 * @param session - La séance à afficher.
 * @param onPress - Callback déclenché au tap sur la carte (navigation).
 * @param onDelete - Callback déclenché à la suppression (bouton ou swipe).
 * @param onDuplicate - Callback déclenché à la duplication.
 */
export function SessionCard({ session, onPress, onDelete, onDuplicate }: Props) {
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
          accessibilityLabel="Supprimer la séance"
        >
          <Ionicons name="trash-outline" size={20} color={colors.text} />
        </Pressable>
      )}
    >
      <Pressable
        style={styles.card}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Séance ${session.name}`}
      >
        <View style={styles.content}>
          <Text style={styles.name}>{session.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatSessionDate(session.date)}</Text>
            <Text style={styles.count}>
              {session.exercises.length} exercice{session.exercises.length === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={onDuplicate}
          accessibilityRole="button"
          accessibilityLabel="Dupliquer la séance"
        >
          <Ionicons name="copy-outline" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la séance"
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
    marginRight: spacing.sm,
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
