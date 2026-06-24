import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Exercise } from '../types';
import { colors, radius, spacing } from '../constants/theme';
import { EXERCISE_PRESETS } from '../constants/exercisePresets';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (exercise: Omit<Exercise, 'id'>) => void;
  /** Exercice à modifier ; absent = mode création. */
  editingExercise?: Exercise | null;
};

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Modal bottom-sheet pour ajouter ou modifier un exercice d'une séance :
 * nom, séries, reps et poids, avec validation avant soumission. En mode
 * création, propose des presets pour accélérer la saisie du nom.
 * @param visible - Affiche ou masque le modal.
 * @param onClose - Callback de fermeture (croix/backdrop), réinitialise les champs.
 * @param onSubmit - Callback appelé avec l'exercice validé (création ou modification).
 * @param editingExercise - Si fourni, le modal s'ouvre en mode édition pré-rempli.
 */
export function AddExerciseModal({ visible, onClose, onSubmit, editingExercise }: Props) {
  /** ============================================================
   *  STATE & REFS
   * ============================================================ */
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  const isEditing = Boolean(editingExercise);

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Resynchronise les champs avec l'exercice en cours d'édition (ou vide en création). */
  useEffect(() => {
    if (editingExercise) {
      setName(editingExercise.name);
      setSets(String(editingExercise.sets));
      setReps(String(editingExercise.reps));
      setWeight(String(editingExercise.weight));
    } else {
      setName('');
      setSets('');
      setReps('');
      setWeight('');
    }
    setError('');
  }, [editingExercise]);

  /** ============================================================
   *  HANDLERS
   * ============================================================ */

  /** Vide tous les champs du formulaire. */
  const reset = () => {
    setName('');
    setSets('');
    setReps('');
    setWeight('');
    setError('');
  };

  /** Ferme le modal et réinitialise les champs pour la prochaine ouverture. */
  const handleClose = () => {
    reset();
    onClose();
  };

  /** Remplit le champ nom avec le preset sélectionné (création uniquement). */
  const handlePickPreset = (preset: string) => {
    setName(preset);
  };

  /** Valide les champs puis transmet l'exercice au parent, ou affiche une erreur. */
  const handleSubmit = () => {
    const trimmedName = name.trim();
    const parsedSets = parseInt(sets, 10);
    const parsedReps = parseInt(reps, 10);
    const parsedWeight = parseFloat(weight);

    if (
      !trimmedName ||
      !Number.isFinite(parsedSets) ||
      parsedSets <= 0 ||
      !Number.isFinite(parsedReps) ||
      parsedReps <= 0 ||
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0
    ) {
      setError('Renseigne un nom et des valeurs valides.');
      return;
    }

    onSubmit({ name: trimmedName, sets: parsedSets, reps: parsedReps, weight: parsedWeight });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {isEditing ? "Modifier l'exercice" : 'Ajouter un exercice'}
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {!isEditing && (
              <FlatList
                data={EXERCISE_PRESETS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                style={styles.presetList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.presetChip}
                    onPress={() => handlePickPreset(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choisir le preset ${item}`}
                  >
                    <Text style={styles.presetChipText}>{item}</Text>
                  </Pressable>
                )}
              />
            )}

            <Text style={styles.label}>Exercice</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Développé couché"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Séries</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={sets}
              onChangeText={setSets}
            />

            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
            />

            <Text style={styles.label}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="80"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <Pressable
            style={styles.addButton}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? "Enregistrer l'exercice" : "Ajouter l'exercice"}
          >
            <Text style={styles.addButtonText}>{isEditing ? 'Enregistrer' : 'Ajouter'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  presetList: {
    marginBottom: spacing.md,
  },
  presetChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  presetChipText: {
    color: colors.text,
    fontSize: 13,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 44,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
