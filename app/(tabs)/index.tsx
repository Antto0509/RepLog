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
import { useSessionsContext } from '../../hooks/useSessions';
import { SessionCard } from '../../components/SessionCard';
import { colors, radius, spacing } from '../../constants/theme';

/**
 * Écran "Séances" : liste des séances (plus récentes en premier), création
 * via un bouton "+" qui ouvre un prompt natif (iOS) ou un mini-modal (Android,
 * car `Alert.prompt` n'existe pas sur cette plateforme).
 */
export default function SeancesScreen() {
  /** ============================================================
   *  STATE & REFS
   * ============================================================ */
  const { sessions, addSession, deleteSession, duplicateSession } = useSessionsContext();
  const navigation = useNavigation();
  const [androidModalVisible, setAndroidModalVisible] = useState(false);
  const [androidName, setAndroidName] = useState('');

  /** ============================================================
   *  HANDLERS
   * ============================================================ */

  /** Ouvre le prompt natif iOS ou le modal Android selon la plateforme. */
  const handleAddPress = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Nouvelle séance',
        'Nom de la séance',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer',
            onPress: (name?: string) => {
              if (name && name.trim()) addSession(name.trim());
            },
          },
        ],
        'plain-text'
      );
    } else {
      setAndroidModalVisible(true);
    }
  };

  /** Valide et crée la séance depuis le modal Android, puis le referme. */
  const handleAndroidCreate = () => {
    const trimmed = androidName.trim();
    if (trimmed) addSession(trimmed);
    setAndroidName('');
    setAndroidModalVisible(false);
  };

  /** Ferme le modal Android sans créer de séance. */
  const handleAndroidClose = () => {
    setAndroidName('');
    setAndroidModalVisible(false);
  };

  /** Duplique une séance et navigue directement vers la copie créée. */
  const handleDuplicate = async (id: string) => {
    const newId = await duplicateSession(id);
    if (newId) {
      router.push({ pathname: '/session/[id]', params: { id: newId } });
    }
  };

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Injecte le bouton "+" dans le header natif des tabs (titre déjà géré par le layout). */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          style={styles.addButton}
          onPress={handleAddPress}
          accessibilityRole="button"
          accessibilityLabel="Créer une séance"
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
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
            onDelete={() => deleteSession(item.id)}
            onDuplicate={() => handleDuplicate(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune séance. Lance-toi 💪</Text>
          </View>
        }
      />

      <Modal
        visible={androidModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleAndroidClose}
      >
        <Pressable style={styles.backdrop} onPress={handleAndroidClose} />
        <KeyboardAvoidingView behavior="height" style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Nouvelle séance</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de la séance"
              placeholderTextColor={colors.textMuted}
              value={androidName}
              onChangeText={setAndroidName}
              autoFocus
            />
            <Pressable
              style={styles.createButton}
              onPress={handleAndroidCreate}
              accessibilityRole="button"
              accessibilityLabel="Créer la séance"
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
