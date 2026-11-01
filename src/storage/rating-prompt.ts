import AsyncStorage from '@react-native-async-storage/async-storage';

interface RatingProgress {
  completed: number;
  runIds: string[];
  requested: boolean;
}

const KEY = 'sort-and-roll.rating-prompt.v1';
const COMPLETIONS_BEFORE_REQUEST = 30;
let progress: RatingProgress | null = null;
let operations = Promise.resolve();

function parseProgress(raw: string | null): RatingProgress {
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (
      value?.version === 1 &&
      Number.isSafeInteger(value.completed) &&
      value.completed >= 0 &&
      Array.isArray(value.runIds) &&
      value.runIds.every((runId: unknown) => typeof runId === 'string') &&
      typeof value.requested === 'boolean'
    ) {
      return {
        completed: value.completed,
        runIds: value.runIds.slice(-1000),
        requested: value.requested,
      };
    }
  } catch {
    // A malformed review counter must never interfere with game progress.
  }
  return { completed: 0, runIds: [], requested: false };
}

async function readProgress(): Promise<RatingProgress> {
  return (progress ??= parseProgress(await AsyncStorage.getItem(KEY)));
}

export function recordCompletedRun(runId: string): Promise<boolean> {
  let shouldRequest = false;
  const operation = operations
    .catch(() => undefined)
    .then(async () => {
      const current = await readProgress();
      if (!runId || current.runIds.includes(runId)) return;

      const completed = current.completed + 1;
      shouldRequest = !current.requested && completed >= COMPLETIONS_BEFORE_REQUEST;
      const next = {
        completed,
        runIds: [...current.runIds, runId].slice(-1000),
        requested: current.requested || shouldRequest,
      };
      await AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, ...next }));
      progress = next;
    });
  operations = operation;
  return operation.then(() => shouldRequest);
}
