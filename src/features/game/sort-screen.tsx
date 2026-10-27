import { useAds } from './ads';
import { AdBanner } from './ad-banner';
import { earnedPower } from '../../policies/ads';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Animated,
  Image,
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
  type LayoutRectangle,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AppearanceContext, DARK, LIGHT, useAppearance, type Palette } from './appearance';
import { COSMETIC_PREVIEW } from '../../config/preview';
import { BACKGROUNDS, backgroundUnlocked } from '../../config/backgrounds';
import { SceneDecor } from './scene-decor';
import { useFeedback } from './feedback-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  play,
  complete,
  removeColour,
  solve,
  solved,
  stars,
  activatePower,
  type Game,
  type Mode,
  type Move,
  type Power,
} from '../../engine/game';
import {
  enter,
  finish,
  load,
  POWERS,
  resetGame,
  rollover,
  save,
  type Progress,
} from '../../storage/progress';
import { Bottle, BottleArt, COLOUR_NAMES } from './bottle';
import { PowerIcon } from './power-icon';
import { PourFlight, type Flight } from './pour-flight';

const MODES: { id: Mode; icon: string; name: string; text: string; colour: string }[] = [
  {
    id: 'relaxed',
    icon: '✦',
    name: 'Journey',
    text: 'Start easy. Grow into medium and hard puzzles.',
    colour: '#edf9ef',
  },
  {
    id: 'daily',
    icon: '☀',
    name: 'Daily challenge',
    text: 'A fresh puzzle with hidden colours and a lock.',
    colour: '#fff5da',
  },
  {
    id: 'weekly',
    icon: '⚑',
    name: 'Weekly journey',
    text: '99 little steps. One colourful adventure.',
    colour: '#e8f3ff',
  },
];
const MODE_BORDERS = {
  dark: ['#43dfc1', '#c3a4ff', '#ffc247', '#79b9ff'],
  light: ['#16876f', '#7953c1', '#ba7c14', '#3477b5'],
} as const;
const TOOLS: Record<Power, { name: string; help: string; colour: string }> = {
  undo: { name: 'Undo', help: 'Take back your last pour.', colour: '#a98be4' },
  hint: { name: 'Hint', help: 'Light up a helpful next pour.', colour: '#f1ba4b' },
  bottle: {
    name: 'Extra bottle',
    help: 'Make a little more space. Up to two extra bottles per puzzle.',
    colour: '#61bcae',
  },
  reveal: { name: 'Reveal', help: 'Uncover every hidden colour.', colour: '#77a5e0' },
  remove: {
    name: 'Colour pop',
    help: 'Tap a bottle to remove its top colour everywhere.',
    colour: '#e98ba4',
  },
};
function ThemeIcon({ dark, colour }: { dark: boolean; colour: string }) {
  return (
    <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
      {dark ? (
        <>
          <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: colour }} />
          {Array.from({ length: 8 }, (_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 2,
                height: 4,
                backgroundColor: colour,
                borderRadius: 1,
                transform: [{ rotate: `${i * 45}deg` }, { translateY: -10 }],
              }}
            />
          ))}
        </>
      ) : (
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 10,
            borderLeftWidth: 5,
            borderBottomWidth: 5,
            borderColor: colour,
            transform: [{ rotate: '-25deg' }],
          }}
        />
      )}
    </View>
  );
}
function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  const p = useAppearance();
  const s = useMemo(() => makeStyles(p), [p]);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.button, secondary && s.secondary]}
    >
      <Text style={[s.buttonText, secondary && { color: p.text }]}>{label}</Text>
    </Pressable>
  );
}
function WinCelebration({
  completedBottles,
  rating,
  reduced,
}: {
  completedBottles: number;
  rating: number;
  reduced: boolean;
}) {
  const [burst] = useState(() => new Animated.Value(0));
  const count = Math.min(15, 3 + completedBottles * 2 + rating);
  const colours = ['#ffb547', '#35d7b7', '#c3a3ff', '#ff78b7', '#83b8ff'];
  useEffect(() => {
    burst.stopAnimation();
    burst.setValue(reduced ? 0.55 : 0);
    if (reduced) return;
    const animation = Animated.timing(burst, {
      toValue: 1,
      duration: 760 + completedBottles * 35,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [burst, completedBottles, rating, reduced]);
  return (
    <View style={{ width: 150, height: 68, alignSelf: 'center' }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const distance = 18 + completedBottles * 3 + rating * 2;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: burst.interpolate({
                inputRange: [0, 0.18, 0.6, 1],
                outputRange: [0, 1, 0.95, 0],
              }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
                {
                  scale: burst.interpolate({
                    inputRange: [0, 0.2, 0.65, 1],
                    outputRange: [0.2, 1.2, 1, 0.5],
                  }),
                },
              ],
            }}
          >
            <Text style={{ color: colours[i % colours.length], fontSize: i % 3 ? 17 : 20 }}>
              {i % 3 ? '✦' : '●'}
            </Text>
          </Animated.View>
        );
      })}
    </View>
  );
}
export default function SortScreen() {
  const feedback = useFeedback();
  const ads = useAds();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode =
    params.mode === 'challenge'
      ? 'relaxed'
      : MODES.find((m) => m.id === params.mode)?.id;
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [boardAreaHeight, setBoardAreaHeight] = useState(0);
  const p = progress?.appearance === 'light' ? LIGHT : DARK;
  const s = useMemo(() => makeStyles(p), [p]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [pouring, setPouring] = useState<Move | null>(null);
  const [flight, setFlight] = useState<(Flight & { next: Game; move: Move }) | null>(null);
  const [queuedFlight, setQueuedFlight] = useState<(Flight & { next: Game; move: Move }) | null>(
    null,
  );
  const queuedFlightRef = useRef<(Flight & { next: Game; move: Move }) | null>(null);
  const [transferred, setTransferred] = useState(false);
  const [reduced, setReduced] = useState(false);
  const positions = useRef<Record<number, LayoutRectangle>>({});
  const [win, setWin] = useState<Game | null>(null);
  const [sheet, setSheet] = useState<
    'settings' | 'closet' | 'backgrounds' | 'intro' | Power | null
  >(null);
  const [backgroundPage, setBackgroundPage] = useState(0);
  const [message, setMessage] = useState('');
  const [removing, setRemoving] = useState(false);
  const busy = useRef(false);

  const loaded = useRef(false);
  const session = useRef(0);
  const activeMode = useRef(mode);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      session.current++;
      activeMode.current = mode;
      void load()
        .then((p) => {
          if (alive) {
            loaded.current = true;
            p = { ...p, ads: { ...p.ads, interstitialPending: false } };
            feedback.configure(p);
            setFlight(null);
            setQueuedFlight(null);
            queuedFlightRef.current = null;
            setPouring(null);
            setTransferred(false);
            setSelected(null);
            setHint(null);
            setWin(null);
            setRemoving(false);
            setMessage('');
            if (mode && !p.onboarded) setSheet('intro');
            setProgress(
              mode &&
                !(mode === 'daily' && p.dailyDone) &&
                !(mode === 'weekly' && p.weeklyLevel > 99)
                ? enter(p, mode)
                : p,
            );
          }
        })
        .catch(() => {
          if (alive) setError('Could not load your progress. Tap Retry to try again.');
        });
      return () => {
        alive = false;
        session.current++;
        busy.current = false;
        activeMode.current = undefined;
      };
    }, [mode, setWin, setMessage, setSheet, feedback]),
  );
  useEffect(() => {
    if (progress && loaded.current)
      void save(progress)
        .then(() => setError(''))
        .catch(() =>
          setError('Progress could not be saved. Please keep the app open and try again.'),
        );
  }, [progress]);
  useEffect(() => {
    const refresh = () => setProgress((p) => (p ? rollover(p, new Date()) : p));
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const timer = setInterval(refresh, 60000);
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => listener.remove();
  }, []);
  const game = mode ? (progress?.games[mode] ?? win) : undefined;
  function open(id: Mode) {
    if (!progress) return;
    setProgress(enter(rollover(progress, new Date()), id));
    router.push({ pathname: '/', params: { mode: id } });
  }
  async function transition(action: () => void) {
    if (busy.current || !progress) return;
    busy.current = true;
    const expectedSession = session.current;
    try {
      if (progress.ads.interstitialPending) {
        const next = { ...progress, ads: { ...progress.ads, interstitialPending: false } };
        await save(next);
        setProgress(next);
        await ads.betweenLevels();
      }
      if (session.current === expectedSession) action();
    } catch {
      setError('Could not save progress. Please try again.');
    } finally {
      if (session.current === expectedSession) busy.current = false;
    }
  }
  function home() {
    void transition(() => {
      setWin(null);
      router.replace('/');
    });
  }
  function dismissIntro() {
    if (progress) setProgress({ ...progress, onboarded: true });
    setSheet(null);
  }
  function commit(next: Game, spent?: Power) {
    if (!mode || !progress) return;
    let p = {
      ...progress,
      games: { ...progress.games, [mode]: next },
      inventory: { ...progress.inventory },
    };
    if (spent) p.inventory[spent]--;
    if (solved(next.board)) {
      feedback.cue('win');
      setWin(next);
      p = finish(p, mode);
    } else if (game && next.moves > game.moves) {
      const newlyFinished = next.board.some((b, i) => complete(b) && !complete(game.board[i]));
      feedback.cue(newlyFinished ? 'bottle' : 'settle');
    }
    setProgress(p);
  }
  function buildFlight(base: Game, move: Move) {
    const next = play(base, move);
    const source = positions.current[move[0]],
      target = positions.current[move[1]];
    if (next === base || !source || !target) return null;
    return {
      source,
      target,
      width: bottleWidth,
      height: bottleHeight,
      boardWidth,
      motion: new Animated.Value(0),
      targetBefore: base.board[move[1]],
      targetAfter: next.board[move[1]],
      before: base.board[move[0]],
      after: next.board[move[0]],
      shape: progress?.shape ?? 0,
      reduced,
      next,
      move,
    };
  }
  function tap(index: number) {
    if (!game || win) return;
    const animating = !!flight;
    if ((busy.current && !animating) || (animating && queuedFlight)) {
      if (queuedFlight) setMessage('Your next pour is queued.');
      return;
    }
    const boardGame = flight?.next ?? game;
    if (removing) {
      const colour = boardGame.board[index].water.at(-1);
      if (colour) {
        const next = removeColour(boardGame, colour);
        if (next !== boardGame) {
          commit(next, 'remove');
          if (!solved(next.board)) feedback.cue('tool');
        }
        setRemoving(false);
      }
      return;
    }
    if (selected === null) {
      if (boardGame.board[index].water.length && boardGame.board[index].lock === null) {
        setSelected(index);
        feedback.cue('select');
      } else if (boardGame.board[index].lock) {
        setMessage(
          `Complete a ${COLOUR_NAMES[boardGame.board[index].lock!]} bottle to unlock this one.`,
        );
      }
      return;
    }
    if (selected === index) {
      setSelected(null);
      return;
    }
    const move: Move = [selected, index];
    const nextFlight = buildFlight(boardGame, move);
    if (!nextFlight) {
      setSelected(boardGame.board[index].water.length ? index : null);
      feedback.cue('invalid');
      setMessage('Pour onto a matching colour or into an empty bottle.');
      return;
    }
    if (animating) {
      queuedFlightRef.current = nextFlight;
      setQueuedFlight(nextFlight);
      setSelected(null);
      setMessage(`Next pour queued · bottle ${move[0] + 1} to ${move[1] + 1}.`);
      return;
    }
    busy.current = true;
    setSelected(null);
    setPouring(move);
    setTransferred(false);
    setFlight(nextFlight);
    setHint(null);
    setMessage('');
  }

  function power(id: Power) {
    if (!game || !progress || busy.current || win) return;
    if (!progress.inventory[id]) {
      busy.current = true;
      setMessage('Loading rewarded ad…');
      const expectedMode = mode;
      const expectedSession = session.current;
      void ads
        .watch(async (transaction) => {
          const latest = await load();
          if (
            session.current !== expectedSession ||
            activeMode.current !== expectedMode ||
            latest.completed !== progress.completed ||
            latest.games[game.mode]?.seed !== game.seed
          )
            return;
          const next = earnedPower(latest, id, transaction);
          setProgress(next);
          await save(next);
        })
        .then((earned) => {
          if (session.current !== expectedSession) return;
          setMessage(
            earned
              ? `${TOOLS[id].name} added. Tap it to use.`
              : 'Ad not ready or not completed. No charge added; try again shortly.',
          );
        })
        .catch(() => {
          if (session.current === expectedSession)
            setError('Could not save your reward. Please retry saving.');
        })
        .finally(() => {
          if (session.current === expectedSession) busy.current = false;
        });
      return;
    }
    setMessage('');
    setHint(null);
    setSelected(null);
    if (id === 'remove') {
      setRemoving((v) => !v);
      return;
    }
    if (id === 'hint') {
      const path = game.solution.length ? game.solution : solve(game.board);
      if (path?.length) {
        setHint(path[0]);
        commit({ ...game, solution: path }, id);
        feedback.cue('tool');
        setMessage(`Pour bottle ${path[0][0] + 1} into bottle ${path[0][1] + 1}.`);
      } else setMessage('No hint found here. Try Undo, an extra bottle, or a free restart.');
      return;
    }
    const next = activatePower(game, id);
    if (next !== game) {
      commit(next, id);
      feedback.cue('tool');
    } else
      setMessage(
        id === 'undo'
          ? 'Make a pour first.'
          : id === 'reveal'
            ? 'There are no hidden colours here.'
            : 'You already have two extra bottles.',
      );
  }
  if (!progress)
    return (
      <SafeAreaView
        style={[
          s.safe,
          { backgroundColor: p.backgrounds[0][0], justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <Text style={s.title}>sort & roll.</Text>
        <Text style={s.body}>{error || 'A little colour is on its way…'}</Text>
        {!!error && (
          <Button
            label="Retry"
            onPress={() => {
              void load()
                .then((p) => {
                  loaded.current = true;
                  feedback.configure(p);
                  setProgress(p);
                })
                .catch(() => undefined);
            }}
          />
        )}
      </SafeAreaView>
    );
  const background = BACKGROUNDS[progress.theme];
  const theme = p.dark ? background.dark : background.light;
  const nextBackground = BACKGROUNDS.find((b) => b.unlockAt > progress.completed);
  const compact = height < 720;
  const toolSize = Math.min(62, (width - 64) / 5);
  const boardWidth = Math.min(width - 36, 480);
  const cols = game ? Math.min(5, Math.ceil(game.board.length / 2)) : 4;
  const rows = game ? Math.ceil(game.board.length / cols) : 2;
  const bottleWidth = Math.min(85, (boardWidth - 8 * (cols - 1)) / cols);
  const availableBottleHeight =
    boardAreaHeight > 0
      ? (boardAreaHeight - 8 - 8 * (rows - 1) - 52 * rows) / rows
      : (height - 430) / rows;
  const bottleHeight = Math.max(36, Math.min(145, availableBottleHeight));
  return (
    <AppearanceContext.Provider value={p}>
      <StatusBar style={p.dark ? 'light' : 'dark'} />
      <LinearGradient colors={theme} style={{ flex: 1 }} testID="app-background">
        <SceneDecor background={background} />
        <SafeAreaView style={s.safe}>
          {!!error && (
            <Pressable
              onPress={() => {
                void save(progress)
                  .then(() => setError(''))
                  .catch(() => undefined);
              }}
            >
              <Text style={s.error}>{error}</Text>
            </Pressable>
          )}
          {!mode ? (
            <View style={[s.home, { maxWidth: 480 }]}>
              <View style={s.top}>
                <Text style={s.brand}>PIXEL PULSE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={p.dark ? 'Switch to light theme' : 'Switch to dark theme'}
                    onPress={() =>
                      setProgress({ ...progress, appearance: p.dark ? 'light' : 'dark' })
                    }
                    style={s.circle}
                  >
                    <ThemeIcon dark={p.dark} colour={p.accent} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Make it yours: backgrounds and bottle shapes"
                    onPress={() => setSheet('closet')}
                    style={s.circle}
                  >
                    <Text style={{ fontSize: 22, color: p.accent }}>✿</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                    onPress={() => setSheet('settings')}
                    style={s.circle}
                  >
                    <Text style={s.gear}>⚙</Text>
                  </Pressable>
                </View>
              </View>
              <View style={[s.hero, { paddingVertical: compact ? 8 : 22 }]}>
                <Image
                  source={require('../../../assets/branding/bottle-mark.png')}
                  accessible={false}
                  resizeMode="contain"
                  style={{ width: compact ? 68 : 94, height: compact ? 68 : 94, marginBottom: 4 }}
                />
                <Text style={[s.title, compact && { fontSize: 34 }]}>
                  sort & roll<Text style={{ color: p.accent }}>.</Text>
                </Text>
                <Text style={s.subtitle}>A little pour. A lighter mind.</Text>
              </View>
              <View style={{ gap: compact ? 8 : 12 }}>
                {MODES.map((m, index) => {
                  const done =
                    (m.id === 'daily' && progress.dailyDone) ||
                    (m.id === 'weekly' && progress.weeklyLevel > 99);
                  const badge =
                    m.id === 'daily'
                      ? done
                        ? 'DONE ✓'
                        : 'TODAY'
                      : m.id === 'weekly'
                        ? `${Math.min(99, progress.weeklyLevel)} / 99`
                        : `LEVEL ${progress.levels[m.id]}`;
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="button"
                      accessibilityLabel={m.name}
                      accessibilityState={{ disabled: done }}
                      disabled={done}
                      onPress={() => open(m.id)}
                      style={[
                        s.card,
                        {
                          backgroundColor: p.cards[index],
                          borderColor: MODE_BORDERS[p.dark ? 'dark' : 'light'][index],
                          borderWidth: 2,
                          paddingVertical: compact ? 8 : 18,
                          opacity: done ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.modeIcon,
                          {
                            color: p.icons[index],
                          },
                        ]}
                      >
                        {m.icon}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{m.name}</Text>
                        <Text style={s.cardText}>{m.text}</Text>
                      </View>
                      <Text style={s.badge}>{badge}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {!progress.onboarded && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="How to play"
                  onPress={() => setSheet('intro')}
                  style={s.howToPlay}
                >
                  <Text style={{ color: p.accent, fontSize: 12, fontWeight: '800' }}>
                    How to play  ·  Learn the pour rules
                  </Text>
                </Pressable>
              )}
              <Text style={s.footer}>
                {progress.streak ? `${progress.streak} day daily streak · ` : ''}Made for your
                softer moments.
              </Text>
            </View>
          ) : game ? (
            <View style={s.game}>
              <View style={s.top}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to menu"
                  onPress={home}
                  style={s.circle}
                >
                  <Text style={s.gear}>‹</Text>
                </Pressable>
                <Text style={s.eyebrow}>
                  {MODES.find((m) => m.id === mode)?.name.toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={p.dark ? 'Switch to light theme' : 'Switch to dark theme'}
                    onPress={() =>
                      setProgress({ ...progress, appearance: p.dark ? 'light' : 'dark' })
                    }
                    style={s.circle}
                  >
                    <ThemeIcon dark={p.dark} colour={p.accent} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Restart puzzle"
                    onPress={() => {
                      if (!busy.current && !win) {
                        commit(resetGame(game));
                        setSelected(null);
                        setHint(null);
                        setRemoving(false);
                      }
                    }}
                    style={s.circle}
                  >
                    <Text style={s.gear}>↻</Text>
                  </Pressable>
                </View>
              </View>
              <View style={s.levelHeading}>
                <Text style={[s.level, compact && { fontSize: 29 }]}>
                  {mode === 'daily'
                    ? 'Daily challenge'
                    : `Level ${game.level < 10 ? '0' : ''}${game.level}`}
                </Text>
                <Text style={s.subtitle}>
                  {mode === 'relaxed'
                    ? game.level < 10
                      ? 'Easy · Find your flow'
                      : game.level < 25
                        ? 'Medium · A little more to think about'
                        : 'Hard · Hidden colours and locked bottles ahead'
                    : `${game.moves} pours · ${mode === 'weekly' ? `${game.level} of 99` : 'Find your best flow'}`}
                </Text>
              </View>
              {mode === 'weekly' && (
                <View style={s.path}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <View
                      key={i}
                      style={[
                        s.dot,
                        {
                          backgroundColor: i < (game.level - 1) % 11 ? p.accent : p.secondary,
                          width: i === (game.level - 1) % 11 ? 18 : 7,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
              <View
                style={s.boardArea}
                onLayout={(event) => {
                  const nextHeight = event.nativeEvent.layout.height;
                  setBoardAreaHeight((current) =>
                    Math.abs(current - nextHeight) > 1 ? nextHeight : current,
                  );
                }}
              >
                <View style={[s.board, { width: boardWidth }]}>
                  {game.board.map((b, i) => (
                    <Bottle
                      key={i}
                      bottle={
                        transferred && pouring?.[1] === i && flight ? flight.next.board[i] : b
                      }
                      transfer={
                        pouring?.[1] === i && flight
                          ? { motion: flight.motion, before: b, after: flight.next.board[i] }
                          : undefined
                      }
                      index={i}
                      selected={selected === i}
                      hinted={hint?.includes(i) ?? false}
                      ghost={pouring?.[0] === i}
                      target={pouring?.[1] === i}
                      width={bottleWidth}
                      height={bottleHeight}
                      shape={progress.shape}
                      onPress={() => tap(i)}
                      onLayout={(rect) => {
                        positions.current[i] = rect;
                      }}
                    />
                  ))}
                  {flight && (
                    <PourFlight
                      flight={flight}
                      onPourStart={() => feedback.cue('pour')}
                      onTransfer={() => setTransferred(true)}
                      onComplete={() => {
                        commit(flight.next);
                        setTransferred(false);
                        const queued = queuedFlightRef.current;
                        queuedFlightRef.current = null;
                        setQueuedFlight(null);
                        if (queued) {
                          setFlight(queued);
                          setPouring(queued.move);
                          setSelected(null);
                          setMessage('');
                        } else {
                          busy.current = false;
                          setFlight(null);
                          setPouring(null);
                        }
                      }}
                    />
                  )}
                </View>
              </View>
              <Text accessibilityLiveRegion="polite" style={s.feedback}>
                {removing
                  ? 'Tap a bottle to pop its top colour. Tap Colour pop to cancel.'
                  : message || (game.moves === 0 ? 'Tap a bottle, then another to pour.' : '')}
              </Text>
              <View style={s.powerPanel}>
                <View style={s.tools}>
                  {POWERS.map((id) => (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={`${TOOLS[id].name}, ${progress.inventory[id]} remaining${progress.inventory[id] ? '' : ', watch ad for one charge'}`}
                      onPress={() => power(id)}
                      onLongPress={() => setSheet(id)}
                      style={[
                        s.tool,
                        removing && id === 'remove' && { backgroundColor: p.secondary },
                      ]}
                    >
                      <View
                        style={[
                          s.toolIcon,
                          {
                            width: toolSize,
                            height: toolSize,
                            backgroundColor: `${TOOLS[id].colour}24`,
                          },
                        ]}
                      >
                        <PowerIcon power={id} size={toolSize - 5} />
                        <View style={[s.counter, { backgroundColor: TOOLS[id].colour }]}>
                          <Text style={s.counterText}>{progress.inventory[id] || '+'}</Text>
                        </View>
                      </View>
                      <Text style={s.toolLabel}>{TOOLS[id].name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={{ height: 58, alignItems: 'center', justifyContent: 'center' }}>
                <AdBanner />
              </View>
            </View>
          ) : (
            <View style={s.center}>
              <Text style={s.title}>All poured!</Text>
              <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                {mode === 'daily'
                  ? 'Come back tomorrow for a fresh puzzle.'
                  : 'A fresh weekly journey starts on Monday.'}
              </Text>
              <Button label="Back to menu" onPress={home} />
            </View>
          )}
          <Modal visible={!!win} transparent animationType="fade" onRequestClose={home}>
            <View style={s.overlay}>
              <View
                style={[
                  s.sheet,
                  (sheet === 'settings' || sheet === 'backgrounds' || sheet === 'closet') && {
                    gap: 12,
                    padding: 20,
                  },
                  compact && { gap: 8, padding: 16 },
                ]}
              >
                <WinCelebration
                  completedBottles={win?.board.filter(complete).length ?? 1}
                  rating={win ? stars(win) : 1}
                  reduced={reduced}
                />
                <Text style={[s.level, compact && { fontSize: 24 }]}>Beautifully sorted.</Text>
                <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                  {win
                    ? `${'★'.repeat(stars(win))}${'☆'.repeat(3 - stars(win))}  ·  ${win.moves} pours`
                    : ''}
                </Text>
                <Button
                  label={
                    mode === 'daily' || (mode === 'weekly' && progress.weeklyLevel > 99)
                      ? 'Lovely. Back home'
                      : 'One more little pour'
                  }
                  onPress={() => {
                    if (mode === 'daily' || (mode === 'weekly' && progress.weeklyLevel > 99))
                      home();
                    else if (mode)
                      void transition(() => {
                        setWin(null);
                        setProgress((current) =>
                          current
                            ? enter(
                                { ...current, ads: { ...current.ads, interstitialPending: false } },
                                mode,
                              )
                            : current,
                        );
                        setSelected(null);
                        setMessage('');
                      });
                  }}
                />
                <Button secondary label="Back to menu" onPress={home} />
              </View>
            </View>
          </Modal>
          <Modal
            visible={!!sheet}
            transparent
            animationType="fade"
            onRequestClose={() => {
              if (sheet === 'intro' && progress) setProgress({ ...progress, onboarded: true });
              setSheet(null);
            }}
          >
            <View style={s.overlay}>
              <View
                style={[
                  s.sheet,
                  (sheet === 'settings' || sheet === 'backgrounds' || sheet === 'closet') && {
                    gap: 12,
                    padding: 20,
                  },
                  compact && { gap: 8, padding: 16 },
                ]}
              >
                {sheet === 'intro' ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          s.level,
                          { flex: 1, textAlign: 'center', marginLeft: 38 },
                          compact && { fontSize: 24 },
                        ]}
                      >
                        How to play
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close how to play"
                        onPress={dismissIntro}
                        style={s.circle}
                      >
                        <Text style={[s.gear, { fontSize: 22 }]}>×</Text>
                      </Pressable>
                    </View>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      Tap a bottle, then another. Pour onto the same colour or into an empty bottle.
                      Sort every colour into its own bottle. Restart is free; tools are optional.
                    </Text>
                    <Text style={[s.cardTitle, { textAlign: 'center' }]}>A little helping hand</Text>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      Every puzzle can be solved without tools. Use these whenever you want a
                      softer landing.
                    </Text>
                    {POWERS.map((id) => (
                      <View
                        key={id}
                        style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}
                      >
                        <PowerIcon power={id} size={compact ? 30 : 36} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.cardTitle}>{TOOLS[id].name}</Text>
                          <Text style={s.cardText}>{TOOLS[id].help}</Text>
                        </View>
                      </View>
                    ))}
                    {!compact && (
                      <Text style={s.body}>
                        Earn more every 10 levels and from your daily puzzle. Restart is always
                        free.
                      </Text>
                    )}
                  </>
                ) : sheet === 'settings' ? (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>Your little settings</Text>
                    <View style={s.setting}>
                      <Text style={s.cardTitle}>Dark theme</Text>
                      <Switch
                        accessibilityLabel="Dark theme"
                        value={p.dark}
                        onValueChange={(value) =>
                          setProgress({ ...progress, appearance: value ? 'dark' : 'light' })
                        }
                      />
                    </View>
                    <View style={s.setting}>
                      <Text style={s.cardTitle}>Music</Text>
                      <Switch
                        accessibilityLabel="Music"
                        value={progress.music}
                        onValueChange={(value) => {
                          const next = { ...progress, music: value };
                          feedback.configure(next);
                          setProgress(next);
                        }}
                      />
                    </View>
                    <View style={s.setting}>
                      <Text style={s.cardTitle}>Sound effects</Text>
                      <Switch
                        accessibilityLabel="Sound effects"
                        value={progress.sfx}
                        onValueChange={(value) => {
                          const next = { ...progress, sfx: value };
                          feedback.configure(next);
                          setProgress(next);
                          if (value) feedback.cue('select');
                        }}
                      />
                    </View>
                    <View style={s.setting}>
                      <Text style={s.cardTitle}>Vibration</Text>
                      <Switch
                        accessibilityLabel="Vibration"
                        value={progress.vibration}
                        onValueChange={(value) => {
                          const next = { ...progress, vibration: value };
                          feedback.configure(next);
                          setProgress(next);
                          if (value) feedback.cue('select');
                        }}
                      />
                    </View>
                    {ads.privacyRequired && (
                      <Button
                        secondary
                        label="Ad privacy choices"
                        onPress={() => {
                          void ads
                            .privacy()
                            .catch(() => setError('Privacy options are unavailable. Try again.'));
                        }}
                      />
                    )}
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      Your progress saves automatically. Daily puzzles refresh at midnight UTC;
                      weekly journeys on Monday.
                    </Text>
                  </>
                ) : sheet === 'closet' ? (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>Make it yours</Text>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      {COSMETIC_PREVIEW
                        ? 'Preview mode · all bottle shapes are available.'
                        : 'New bottle shapes at 10 and 25 levels.'}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Browse backgrounds"
                      onPress={() => {
                        setBackgroundPage(Math.floor(progress.theme / 4));
                        setSheet('backgrounds');
                      }}
                      style={{
                        height: compact ? 65 : 105,
                        borderRadius: 18,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: p.border,
                      }}
                    >
                      <LinearGradient
                        colors={theme}
                        style={{ flex: 1, padding: 15, justifyContent: 'flex-end' }}
                      >
                        <SceneDecor background={background} preview />
                        <Text style={[s.cardTitle, { color: p.text }]}>{background.name} ↗</Text>
                        <Text style={s.cardText}>
                          {
                            BACKGROUNDS.filter(
                              (_, i) =>
                                COSMETIC_PREVIEW || backgroundUnlocked(i, progress.completed),
                            ).length
                          }{' '}
                          / {BACKGROUNDS.length} collected
                        </Text>
                      </LinearGradient>
                    </Pressable>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      {COSMETIC_PREVIEW
                        ? 'Preview mode · all backgrounds are available.'
                        : nextBackground
                          ? `Next: ${nextBackground.name} · ${nextBackground.unlockAt - progress.completed} more levels`
                          : 'Your collection is complete. Every escape is yours.'}
                    </Text>
                    <Text style={s.cardTitle}>Bottle shapes</Text>
                    <View style={s.options}>
                      {['Elixir', 'Prism', 'Orb'].map((name, i) => (
                        <Pressable
                          key={i}
                          accessibilityRole="button"
                          disabled={!COSMETIC_PREVIEW && progress.completed < [0, 10, 25][i]}
                          onPress={() => setProgress({ ...progress, shape: i })}
                          style={s.shapeOption}
                        >
                          <View
                            pointerEvents="none"
                            style={{ alignItems: 'center', paddingBottom: 7 }}
                          >
                            <BottleArt
                              bottle={{ water: [2, 3], hidden: [], lock: null }}
                              width={compact ? 28 : 34}
                              height={compact ? 34 : 48}
                              shape={i}
                            />
                          </View>
                          <Text style={s.cardText}>
                            {name}
                            {progress.shape === i
                              ? ' ✓'
                              : !COSMETIC_PREVIEW && progress.completed < [0, 10, 25][i]
                                ? ` · ${[0, 10, 25][i]}`
                                : ''}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : sheet === 'backgrounds' ? (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>Little escapes</Text>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      {COSMETIC_PREVIEW
                        ? 'Try every scene. Your level progress stays unchanged.'
                        : 'Play to collect all 16. Keep every scene you earn.'}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {BACKGROUNDS.slice(backgroundPage * 4, backgroundPage * 4 + 4).map(
                        (item, offset) => {
                          const index = backgroundPage * 4 + offset,
                            unlocked =
                              COSMETIC_PREVIEW || backgroundUnlocked(index, progress.completed);
                          return (
                            <Pressable
                              key={item.id}
                              accessibilityRole="button"
                              accessibilityLabel={`${item.name}, ${unlocked ? 'unlocked' : `unlock at ${item.unlockAt} levels`}`}
                              accessibilityState={{
                                disabled: !unlocked,
                                selected: progress.theme === index,
                              }}
                              disabled={!unlocked}
                              onPress={() => setProgress({ ...progress, theme: index })}
                              style={{
                                width: '47.5%',
                                borderRadius: 15,
                                borderWidth: 2,
                                borderColor: progress.theme === index ? p.accent : p.border,
                                overflow: 'hidden',
                                backgroundColor: p.secondary,
                              }}
                            >
                              <LinearGradient
                                colors={p.dark ? item.dark : item.light}
                                style={{ height: compact ? 55 : 75 }}
                              >
                                <SceneDecor background={item} preview />
                                {progress.theme === index && (
                                  <Text
                                    style={{
                                      position: 'absolute',
                                      right: 9,
                                      top: 5,
                                      color: p.accent,
                                      fontWeight: '800',
                                    }}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </LinearGradient>
                              <View style={{ padding: 8, gap: 3 }}>
                                <Text numberOfLines={1} style={[s.cardTitle, { fontSize: 11 }]}>
                                  {item.name}
                                </Text>
                                <Text style={[s.cardText, { marginTop: 0, fontSize: 9 }]}>
                                  {unlocked
                                    ? COSMETIC_PREVIEW
                                      ? 'Available to preview'
                                      : 'Yours to keep'
                                    : `${item.unlockAt} levels · ${Math.max(0, item.unlockAt - progress.completed)} to go`}
                                </Text>
                                {item.season && (
                                  <Text style={{ fontSize: 8, color: p.accent }}>
                                    {item.season.toUpperCase()}
                                  </Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        },
                      )}
                    </View>
                    <View style={s.setting}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Previous backgrounds"
                        disabled={backgroundPage === 0}
                        onPress={() => setBackgroundPage((v) => v - 1)}
                        style={[s.circle, { opacity: backgroundPage ? 1 : 0.3 }]}
                      >
                        <Text style={s.gear}>‹</Text>
                      </Pressable>
                      <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                        {backgroundPage + 1} / 4
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Next backgrounds"
                        disabled={backgroundPage === 3}
                        onPress={() => setBackgroundPage((v) => v + 1)}
                        style={[s.circle, { opacity: backgroundPage < 3 ? 1 : 0.3 }]}
                      >
                        <Text style={s.gear}>›</Text>
                      </Pressable>
                    </View>
                  </>
                ) : sheet ? (
                  <>
                    <View style={{ alignSelf: 'center' }}>
                      <PowerIcon power={sheet} size={82} />
                    </View>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>{TOOLS[sheet].name}</Text>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      {TOOLS[sheet].help}
                    </Text>
                    <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                      {progress.inventory[sheet]
                        ? `${progress.inventory[sheet]} ready to use. Long-press any tool for help.`
                        : 'Tap its + button to watch an ad for one charge. You can also earn free gifts through play.'}
                    </Text>
                  </>
                ) : null}
                <Button
                  label={sheet === 'backgrounds' ? 'Back to collection' : 'Got it'}
                  onPress={() => {
                    if (sheet === 'intro') {
                      dismissIntro();
                      return;
                    }
                    setSheet(sheet === 'backgrounds' ? 'closet' : null);
                  }}
                />
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </AppearanceContext.Provider>
  );
}
function makeStyles(p: Palette) {
  return StyleSheet.create({
    safe: { flex: 1 },
    home: {
      flex: 1,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 22,
      justifyContent: 'space-between',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 50,
    },
    brand: { fontSize: 10, color: p.quiet, fontWeight: '800', letterSpacing: 3 },
    circle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: p.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gear: { fontSize: 27, color: p.accent },
    hero: { alignItems: 'center' },
    title: { color: p.text, fontWeight: '800', fontSize: 47, letterSpacing: -2 },
    subtitle: { fontSize: 12, color: p.muted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
    card: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      borderRadius: 22,
      paddingHorizontal: 16,
      borderWidth: 1.5,
      borderColor: p.border,
      boxShadow: '0px 4px 9px #72548b06',
    },
    modeIcon: { fontSize: 31, width: 35, textAlign: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: p.text },
    cardText: { fontSize: 10, color: p.muted, marginTop: 4, lineHeight: 15 },
    badge: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, color: p.quiet },
    closet: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      marginTop: 8,
      borderRadius: 18,
      backgroundColor: p.surface,
    },
    arrow: { marginLeft: 'auto', fontSize: 24, color: p.accent },
    howToPlay: {
      alignSelf: 'center',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
      backgroundColor: p.surface,
    },
    footer: { fontSize: 9, color: p.quiet, textAlign: 'center', paddingVertical: 13 },
    game: { flex: 1, paddingHorizontal: 16, maxWidth: 700, width: '100%', alignSelf: 'center' },
    eyebrow: { color: p.muted, fontSize: 9, letterSpacing: 2, fontWeight: '800' },
    levelHeading: { alignItems: 'center', paddingTop: 16 },
    level: {
      fontSize: 32,
      fontWeight: '800',
      color: p.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    path: { flexDirection: 'row', gap: 7, justifyContent: 'center', paddingTop: 12 },
    dot: { height: 7, borderRadius: 4 },
    boardArea: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flexShrink: 1,
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 8,
    },
    feedback: {
      color: p.muted,
      fontSize: 11,
      textAlign: 'center',
      minHeight: 36,
      lineHeight: 17,
      paddingHorizontal: 10,
    },
    powerPanel: {
      backgroundColor: p.sheet,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.dark ? '#ffffff24' : '#57436324',
      paddingTop: 4,
      marginBottom: 8,
    },
    tools: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
    tool: {
      alignItems: 'center',
      width: '18.5%',
      maxWidth: 76,
      borderRadius: 16,
      paddingVertical: 8,
    },
    toolIcon: {
      width: 45,
      height: 45,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: p.text,
      marginTop: 8,
      textAlign: 'center',
      minHeight: 28,
    },
    counter: {
      position: 'absolute',
      right: -3,
      bottom: -3,
      minWidth: 21,
      height: 21,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: p.sheet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    overlay: {
      flex: 1,
      backgroundColor: p.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 25,
    },
    sheet: {
      backgroundColor: p.sheet,
      width: '100%',
      maxWidth: 420,
      borderRadius: 30,
      padding: 26,
      gap: 18,
      alignItems: 'stretch',
    },
    body: { fontSize: 13, lineHeight: 22, color: p.muted, textAlign: 'center' },
    button: {
      minHeight: 48,
      borderRadius: 17,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    buttonText: { color: p.accentInk, fontWeight: '700', fontSize: 14 },
    secondary: { backgroundColor: p.secondary },
    setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    options: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    swatch: {
      flex: 1,
      height: 65,
      borderRadius: 14,
      borderColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shapeOption: {
      flex: 1,
      alignItems: 'center',
      padding: 9,
      backgroundColor: p.secondary,
      borderRadius: 8,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
    error: {
      backgroundColor: p.error,
      color: p.errorText,
      padding: 10,
      textAlign: 'center',
      fontSize: 12,
    },
  });
}
