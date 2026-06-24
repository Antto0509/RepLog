import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProgramsContext } from '../../hooks/usePrograms';
import { useSessionsContext } from '../../hooks/useSessions';
import { ProgramCard } from '../../components/ProgramCard';
import { colors, radius, spacing } from '../../constants/theme';

/**
 * Écran "Programmes" : liste des modèles de séances réutilisables, création
 * via un bouton "+" (même flux que la création de séance), navigation
 * immédiate vers le détail du programme créé pour y ajouter des exercices.
 */
export default function ProgramsScreen() {
  /** ============================================================
   *  STATE & REFS
   * ============================================================ */
  const { programs, addProgram, deleteProgram, resetToDemoData: resetPrograms } = useProgramsContext();
  const { resetToDemoData: resetSessions } = useSessionsContext();
  const navigation = useNavigation();
  const [androidModalVisible, setAndroidModalVisible] = useState(false);
  const [androidName, setAndroidName] = useState('');

  /** ============================================================
   *  HANDLERS
   * ============================================================ */

  /** Crée le programme puis navigue vers son détail. */
  const handleCreate = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = await addProgram(trimmed);
    router.push({ pathname: '/program/[id]', params: { id: newId } });
  };

  /** Ouvre le prompt natif iOS ou le modal Android selon la plateforme. */
  const handleAddPress = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Nouveau programme',
        'Nom du programme',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Créer', onPress: (name?: string) => handleCreate(name ?? '') },
        ],
        'plain-text'
      );
    } else {
      setAndroidModalVisible(true);
    }
  };

  /** Valide et crée le programme depuis le modal Android, puis le referme. */
  const handleAndroidCreate = () => {
    handleCreate(androidName);
    setAndroidName('');
    setAndroidModalVisible(false);
  };

  /** Ferme le modal Android sans créer de programme. */
  const handleAndroidClose = () => {
    setAndroidName('');
    setAndroidModalVisible(false);
  };

  /**
   * Utilitaire de dev/démo : remet séances et programmes aux données de
   * démonstration (cf. `lib/seedData.ts`), avec confirmation préalable.
   */
  const handleResetDemoData = () => {
    Alert.alert(
      'Réinitialiser les données ?',
      'Toutes les séances et programmes actuels seront remplacés par les données de démo.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            resetSessions();
            resetPrograms();
          },
        },
      ]
    );
  };

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Injecte le bouton "+" dans le header natif des tabs. */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.addButton}
          onPress={handleAddPress}
          accessibilityRole="button"
          accessibilityLabel="Créer un programme"
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </Pressable>
      ),
    });
  }, [navigation, handleAddPress]);

  /** ============================================================
   *  RENDER
   * ============================================================ */

  return (
    <View style={styles.container}>
      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => router.push({ pathname: '/program/[id]', params: { id: item.id } })}
            onDelete={() => deleteProgram(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun programme. Crée ton premier 🏋️</Text>
          </View>
        }
      />

      <Pressable
        style={styles.resetButton}
        onPress={handleResetDemoData}
        accessibilityRole="button"
        accessibilityLabel="Réinitialiser les données de démo"
      >
        <Text style={styles.resetButtonText}>Réinitialiser les données de démo</Text>
      </Pressable>

      <Modal
        visible={androidModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleAndroidClose}
      >
        <Pressable style={styles.backdrop} onPress={handleAndroidClose} />
        <KeyboardAvoidingView behavior="height" style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Nouveau programme</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du programme"
              placeholderTextColor={colors.textMuted}
              value={androidName}
              onChangeText={setAndroidName}
              autoFocus
            />
            <Pressable
              style={styles.createButton}
              onPress={handleAndroidCreate}
              accessibilityRole="button"
              accessibilityLabel="Créer le programme"
            >
              <Text style={styles.createButtonText}>Créer</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minWidth: 44,
    minHeight: 44,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
  resetButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  resetButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 44,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
