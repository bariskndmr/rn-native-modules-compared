import { Stack } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

import { benchCases, hashesMatch, type BenchCase } from "@/benchmark/cases";
import { JsFrameCounter } from "@/frame-counter";
import { toolkits } from "@/toolkits";

type Results = Record<string, Record<string, number>>;

// Sync benchmarks block the JS thread, so yield once to let the "running" label paint
const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

const format = (value: number, unit: BenchCase["unit"]) =>
  unit === "ms" ? `${value.toFixed(1)} ms` : String(value);

export default function Index() {
  const [results, setResults] = useState<Results>({});
  const [running, setRunning] = useState<string | null>(null);
  const [match, setMatch] = useState<boolean | null>(null);

  const run = async () => {
    setResults({});
    setMatch(hashesMatch(toolkits));
    for (const c of benchCases) {
      for (const t of toolkits) {
        setRunning(`${c.label} · ${t.name}`);
        await nextFrame();
        const value = await c.run(t);
        setResults((r) => ({ ...r, [c.id]: { ...r[c.id], [t.name]: value } }));
      }
    }
    setRunning(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: "Benchmark" }} />

      <JsFrameCounter />
      <Button title={running ? "Running…" : "Run benchmarks"} onPress={run} disabled={!!running} />
      {running && <Text style={styles.muted}>{running}</Text>}
      {match !== null && (
        <Text style={match ? styles.ok : styles.fail}>
          {match ? "✓ All toolkits return the same hashes" : "✗ Hash mismatch between toolkits"}
        </Text>
      )}

      <View style={styles.row}>
        <Text style={[styles.label, styles.head]}>Test</Text>
        {toolkits.map((t) => (
          <Text key={t.name} style={[styles.cell, styles.head]}>
            {t.name}
          </Text>
        ))}
      </View>

      {benchCases.map((c) => {
        const row = results[c.id] ?? {};
        const values = Object.values(row);
        // Lowest time wins; tick counts are just shown as-is
        const best =
          c.unit === "ms" && values.length === toolkits.length ? Math.min(...values) : undefined;

        return (
          <View key={c.id} style={styles.row}>
            <View style={styles.label}>
              <Text>{c.label}</Text>
              <Text style={styles.muted}>{c.hint}</Text>
            </View>
            {toolkits.map((t) => {
              const value: number | undefined = row[t.name];
              return (
                <Text key={t.name} style={[styles.cell, value === best && styles.best]}>
                  {value === undefined ? "–" : format(value, c.unit)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  label: {
    flex: 2,
    gap: 2,
  },
  cell: {
    flex: 1,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  head: {
    fontWeight: "600",
  },
  best: {
    color: "#1a7f37",
    fontWeight: "600",
  },
  muted: {
    color: "#888",
    fontSize: 12,
  },
  ok: {
    color: "#1a7f37",
  },
  fail: {
    color: "#cf222e",
  },
});
