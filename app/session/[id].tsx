import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionsContext } from '../../hooks/useSessions';
import { ExerciseRow } from '../../components/ExerciseRow';
import { AddExerciseModal } from '../../components/AddExerciseModal';
import { getSessionVolume } from '../../lib/stats';
import { colors, radius, spacing } from '../../constants/theme';
import type { Exercise } from '../../types';

/** Durée par défaut du minuteur de repos, en secondes. */
const REST_DURATION_SECONDS = 90;

/**
 * Écran de détail d'une séance : titre éditable, volume total, liste des
 * exercices (tap = éditer, appui long = stats, swipe/bouton = supprimer),
 * bouton flottant pour ajouter via `AddExerciseModal`, et minuteur de repos
 * démarré manuellement par l'utilisateur (pas automatiquement à l'ajout —
 * une séance peut être préparée à l'avance et faite plus tard).
 */
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sessions, updateSessionName, addExercise, updateExercise, deleteExercise, duplicateSession } =
    useSessionsContext();
  const session = sessions.find((s) => s.id === id);

  /** ============================================================
   *  STATE & REFS
   * ============================================================ */
  const [titleDraft, setTitleDraft] = useState(session?.name ?? '');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);

  /** ============================================================
   *  HANDLERS
   * ============================================================ */

  /** Persiste le nouveau titre si modifié, ou restaure l'ancien si vide. */
  const handleTitleBlur = (): void => {
    if (!session) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== session.name) {
      updateSessionName(session.id, trimmed);
    } else {
      setTitleDraft(session.name);
    }
  };

  /** Ouvre le modal en mode édition pour l'exercice donné. */
  const handleOpenEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setModalVisible(true);
  };

  /** Ouvre le modal en mode création. */
  const handleOpenAdd = () => {
    setEditingExercise(null);
    setModalVisible(true);
  };

  /** Ferme le modal et nettoie l'état d'édition. */
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingExercise(null);
  };

  /** Crée ou met à jour un exercice selon le mode du modal. */
  const handleSubmitExercise = (data: Omit<Exercise, 'id'>) => {
    if (!session) return;
    if (editingExercise) {
      updateExercise(session.id, editingExercise.id, data);
    } else {
      addExercise(session.id, data);
    }
    setModalVisible(false);
    setEditingExercise(null);
  };

  /** Démarre le minuteur de repos, déclenché manuellement par l'utilisateur. */
  const handleStartRest = () => {
    setRestSecondsLeft(REST_DURATION_SECONDS);
  };

  /** Arrête le minuteur de repos avant la fin. */
  const handleSkipRest = () => {
    setRestSecondsLeft(null);
  };

  /** Duplique la séance courante et navigue vers la copie créée. */
  const handleDuplicate = async () => {
    if (!session) return;
    const newId = await duplicateSession(session.id);
    if (newId) {
      router.push({ pathname: '/session/[id]', params: { id: newId } });
    }
  };

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Fait décompter le minuteur de repos d'une seconde par tick jusqu'à 0. */
  useEffect(() => {
    if (restSecondsLeft === null || restSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => (prev === null ? null : Math.max(prev - 1, 0)));
    }, 1000);
    return () => clearInterval(interval);
  }, [restSecondsLeft]);

  /** Injecte le bouton de duplication dans le header natif. */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.headerButton}
          onPress={handleDuplicate}
          accessibilityRole="button"
          accessibilityLabel="Dupliquer la séance"
        >
          <Ionicons name="copy-outline" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, handleDuplicate]);

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Séance introuvable</Text>
      </View>
    );
  }

  /** ============================================================
   *  RENDER
   * ============================================================ */

  const minutes = restSecondsLeft !== null ? Math.floor(restSecondsLeft / 60) : 0;
  const seconds = restSecondsLeft !== null ? restSecondsLeft % 60 : 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.title}
        value={titleDraft}
        onChangeText={setTitleDraft}
        onBlur={handleTitleBlur}
      />

      <Text style={styles.volume}>Volume total : {getSessionVolume(session)} kg</Text>

      {restSecondsLeft !== null ? (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>
            Repos : {minutes}:{String(seconds).padStart(2, '0')}
          </Text>
          <Pressable
            style={styles.restSkipButton}
            onPress={handleSkipRest}
            accessibilityRole="button"
            accessibilityLabel="Passer le repos"
          >
            <Text style={styles.restSkip}>Passer</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.restBanner, styles.restBannerStart]}
          onPress={handleStartRest}
          accessibilityRole="button"
          accessibilityLabel="Démarrer le repos"
        >
          <Ionicons name="timer-outline" size={18} color={colors.primary} />
          <Text style={styles.restStartText}>Démarrer le repos</Text>
        </Pressable>
      )}

      <FlatList
        data={session.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: spacing.xl + insets.bottom },
        ]}
        renderItem={({ item }) => (
          <ExerciseRow
            exercise={item}
            onPress={() => handleOpenEdit(item)}
            onLongPress={() =>
              router.push({ pathname: '/exercise/[name]', params: { name: item.name.trim() } })
            }
            onDelete={() => deleteExercise(session.id, item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun exercice. Ajoute le premier 💪</Text>
          </View>
        }
      />

      <Pressable
        style={[styles.fab, { bottom: spacing.lg + insets.bottom }]}
        onPress={handleOpenAdd}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un exercice"
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>

      <AddExerciseModal
        visible={modalVisible}
        editingExercise={editingExercise}
        onClose={handleCloseModal}
        onSubmit={handleSubmitExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: spacing.md,
  },
  volume: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  restText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  restBannerStart: {
    justifyContent: 'flex-start',
  },
  restStartText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  restSkipButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restSkip: {
    color: colors.textMuted,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
});
