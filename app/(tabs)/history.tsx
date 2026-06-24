import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSessionsContext } from '../../hooks/useSessions';
import { SessionCard, formatSessionDate } from '../../components/SessionCard';
import { colors, spacing } from '../../constants/theme';
import type { Session } from '../../types';

/** ============================================================
 *  TYPES & INTERFACES
 * ============================================================ */

/** Ligne de la liste : soit un en-tête de groupe par jour, soit une séance. */
type Row =
  | { type: 'header'; key: string; label: string }
  | { type: 'session'; key: string; session: Session };

/**
 * Transforme une liste de séances triées (plus récentes en premier) en lignes
 * `header | session`, avec un en-tête de date inséré à chaque changement de jour.
 * @param sorted - Séances déjà triées par date décroissante.
 */
function buildRows(sorted: Session[]): Row[] {
  const rows: Row[] = [];
  let lastDateKey = '';
  for (const s of sorted) {
    const dateKey = s.date.slice(0, 10);
    if (dateKey !== lastDateKey) {
      rows.push({ type: 'header', key: `h-${dateKey}`, label: formatSessionDate(s.date) });
      lastDateKey = dateKey;
    }
    rows.push({ type: 'session', key: s.id, session: s });
  }
  return rows;
}

/** ============================================================
 *  RENDER
 * ============================================================ */

/**
 * Écran "Historique" : toutes les séances triées par date décroissante,
 * regroupées visuellement par jour.
 */
export default function HistoriqueScreen() {
  const { sessions, deleteSession, duplicateSession } = useSessionsContext();

  const rows = useMemo(() => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return buildRows(sorted);
  }, [sessions]);

  /** Duplique une séance et navigue directement vers la copie créée. */
  const handleDuplicate = async (id: string) => {
    const newId = await duplicateSession(id);
    if (newId) {
      router.push({ pathname: '/session/[id]', params: { id: newId } });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <Text style={styles.groupLabel}>{item.label}</Text>
          ) : (
            <SessionCard
              session={item.session}
              onPress={() =>
                router.push({ pathname: '/session/[id]', params: { id: item.session.id } })
              }
              onDelete={() => deleteSession(item.session.id)}
              onDuplicate={() => handleDuplicate(item.session.id)}
            />
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune séance enregistrée.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  groupLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
});
