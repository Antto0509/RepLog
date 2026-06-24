import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgramsContext } from '../../hooks/usePrograms';
import { useSessionsContext } from '../../hooks/useSessions';
import { ExerciseRow } from '../../components/ExerciseRow';
import { AddExerciseModal } from '../../components/AddExerciseModal';
import { colors, radius, spacing } from '../../constants/theme';
import type { Exercise } from '../../types';

/**
 * Écran de détail d'un programme : titre éditable, liste des exercices
 * modèles (tap = éditer, appui long = stats, swipe/bouton = supprimer),
 * bouton flottant pour ajouter via `AddExerciseModal`, et action d'en-tête
 * pour créer une séance à partir de ce programme.
 */
export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { programs, updateProgramName, addExerciseToProgram, updateExerciseInProgram, deleteExerciseFromProgram } =
    useProgramsContext();
  const { createSessionFromProgram } = useSessionsContext();
  const program = programs.find((p) => p.id === id);

  /** ============================================================
   *  STATE & REFS
   * ============================================================ */
  const [titleDraft, setTitleDraft] = useState(program?.name ?? '');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  /** ============================================================
   *  HANDLERS
   * ============================================================ */

  /** Persiste le nouveau titre si modifié, ou restaure l'ancien si vide. */
  const handleTitleBlur = (): void => {
    if (!program) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== program.name) {
      updateProgramName(program.id, trimmed);
    } else {
      setTitleDraft(program.name);
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

  /** Crée ou met à jour un exercice modèle selon le mode du modal. */
  const handleSubmitExercise = (data: Omit<Exercise, 'id'>) => {
    if (!program) return;
    if (editingExercise) {
      updateExerciseInProgram(program.id, editingExercise.id, data);
    } else {
      addExerciseToProgram(program.id, data);
    }
    setModalVisible(false);
    setEditingExercise(null);
  };

  /** Crée une nouvelle séance à partir de ce programme et navigue vers elle. */
  const handleCreateSession = async () => {
    if (!program) return;
    const exercises = program.exercises.map(({ id: _id, ...rest }) => rest);
    const newId = await createSessionFromProgram(program.name, exercises);
    if (newId) {
      router.push({ pathname: '/session/[id]', params: { id: newId } });
    }
  };

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Injecte le bouton "Créer une séance" dans le header natif. */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.headerButton}
          onPress={handleCreateSession}
          accessibilityRole="button"
          accessibilityLabel="Créer une séance à partir de ce programme"
        >
          <Ionicons name="play-outline" size={22} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, handleCreateSession]);

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Programme introuvable</Text>
      </View>
    );
  }

  /** ============================================================
   *  RENDER
   * ============================================================ */

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.title}
        value={titleDraft}
        onChangeText={setTitleDraft}
        onBlur={handleTitleBlur}
      />

      <FlatList
        data={program.exercises}
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
            onDelete={() => deleteExerciseFromProgram(program.id, item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun exercice. Ajoute le premier 🏋️</Text>
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
