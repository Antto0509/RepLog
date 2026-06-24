import { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useSessionsContext } from '../../hooks/useSessions';
import { getEstimated1RM, getExerciseHistory, type ExerciseHistoryEntry } from '../../lib/stats';
import { formatSessionDate } from '../../components/SessionCard';
import { colors, radius, spacing } from '../../constants/theme';

/** Hauteur maximale des barres du graphique, en dp. */
const CHART_HEIGHT = 120;
/** Hauteur minimale d'une barre, pour rester visible même à faible poids. */
const MIN_BAR_HEIGHT = 4;

/** ============================================================
 *  HELPERS
 * ============================================================ */

/** Date courte (JJ/MM) pour les libellés du graphique. */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Écran de stats d'un exercice : 1RM estimé + tendance, graphique de
 * progression du poids, et historique chronologique détaillé (séries/reps/
 * poids) de toutes les occurrences de cet exercice à travers les séances.
 */
export default function ExerciseStatsScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sessions } = useSessionsContext();

  const history = useMemo(() => getExerciseHistory(sessions, name ?? ''), [sessions, name]);
  const maxWeight = useMemo(() => Math.max(...history.map((h) => h.weight), 1), [history]);

  const latest = history.length > 0 ? history[history.length - 1] : null;
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const latest1RM = latest ? getEstimated1RM(latest) : null;
  const previous1RM = previous ? getEstimated1RM(previous) : null;
  const trend =
    latest1RM !== null && previous1RM !== null
      ? latest1RM > previous1RM
        ? 'up'
        : latest1RM < previous1RM
          ? 'down'
          : 'stable'
      : null;

  /** ============================================================
   *  EFFECTS
   * ============================================================ */

  /** Affiche le nom de l'exercice comme titre du header natif. */
  useEffect(() => {
    navigation.setOptions({ title: name ?? '' });
  }, [navigation, name]);

  /** ============================================================
   *  RENDER
   * ============================================================ */

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xl + insets.bottom }]}
        ListHeaderComponent={
          history.length === 0 ? null : (
            <View>
              {latest1RM !== null && (
                <View style={styles.oneRmRow}>
                  <Text style={styles.oneRmText}>1RM estimé : {latest1RM} kg</Text>
                  {trend && (
                    <Text
                      style={[
                        styles.trend,
                        trend === 'up' && styles.trendUp,
                        trend === 'down' && styles.trendDown,
                      ]}
                    >
                      {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                    </Text>
                  )}
                </View>
              )}

              <FlatList
                data={history}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `chart-${item.date}-${index}`}
                style={styles.chart}
                renderItem={({ item }: { item: ExerciseHistoryEntry }) => (
                  <View style={styles.barColumn}>
                    <Text style={styles.barWeight}>{item.weight}</Text>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max((item.weight / maxWeight) * CHART_HEIGHT, MIN_BAR_HEIGHT) },
                      ]}
                    />
                    <Text style={styles.barDate}>{formatShortDate(item.date)}</Text>
                  </View>
                )}
              />
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.date}>{formatSessionDate(item.date)}</Text>
            <Text style={styles.detail}>
              {item.sets} × {item.reps} — {item.weight} kg
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun historique pour cet exercice.</Text>
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
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  oneRmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  oneRmText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  trend: {
    marginLeft: spacing.sm,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  trendUp: {
    color: colors.primary,
  },
  trendDown: {
    color: colors.danger,
  },
  chart: {
    marginBottom: spacing.lg,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 40,
    marginRight: spacing.sm,
  },
  barWeight: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  bar: {
    width: 20,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  barDate: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  date: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  detail: {
    color: colors.textMuted,
    fontSize: 13,
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
