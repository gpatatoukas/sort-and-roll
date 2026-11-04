import { useAds } from './ads';
import { AdBanner } from './ad-banner';
import { BANNER_HEIGHT } from '@/services/ads/adapter';
import * as StoreReview from 'expo-store-review';
import Constants from 'expo-constants';
import { earnedPower } from '../../policies/ads';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  Animated,
  Image,
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
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
import { AppearanceContext, DARK, useAppearance, type Palette } from './appearance';
import { COSMETIC_PREVIEW } from '../../config/preview';
import { BACKGROUNDS, backgroundUnlocked } from '../../config/backgrounds';
import { SceneDecor } from './scene-decor';
import { HomeArtifacts } from './home-artifacts';
import { useFeedback } from './feedback-provider';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  play,
  complete,
  legalMoves,
  removeColour,
  solved,
  stars,
  activatePower,
  type Game,
  type Bottle as BottleState,
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
import { recordCompletedRun } from '../../storage/rating-prompt';
import { Bottle, BottleArt, COLOUR_NAMES } from './bottle';
import { PowerIcon } from './power-icon';
import { LivesMeter } from './lives-meter';
import { grantLife, loseLife, refreshLives, MAX_LIVES } from '../../policies/lives';
import { PourFlight, type Flight } from './pour-flight';

const clockNow = () => Date.now();

const MODES: { id: Mode; name: string; text: string; colour: string }[] = [
  {
    id: 'relaxed',
    name: 'Play',
    text: 'Endless levels',
    colour: '#edf9ef',
  },
  {
    id: 'daily',
    name: 'Daily',
    text: 'New puzzle each day',
    colour: '#fff5da',
  },
  {
    id: 'weekly',
    name: 'Weekly',
    text: '99-step challenge',
    colour: '#e8f3ff',
  },
];
function ModeIcon({ mode, colour }: { mode: Mode; colour: string }) {
  if (mode === 'daily') {
    return (
      <View style={[modeIconStyles.calendar, { borderColor: colour }]}>
        <View style={[modeIconStyles.calendarTop, { backgroundColor: colour }]} />
        <View style={modeIconStyles.calendarRings}>
          <View style={[modeIconStyles.ring, { backgroundColor: colour }]} />
          <View style={[modeIconStyles.ring, { backgroundColor: colour }]} />
        </View>
        <Text style={[modeIconStyles.check, { color: colour }]}>✓</Text>
      </View>
    );
  }
  if (mode === 'weekly') {
    return (
      <View style={[modeIconStyles.weekCalendar, { borderColor: colour }]}>
        <View style={[modeIconStyles.weekHeader, { backgroundColor: colour }]} />
        <View style={modeIconStyles.weekGrid}>
          {Array.from({ length: 7 }, (_, day) => (
            <View
              key={day}
              style={[
                modeIconStyles.weekCell,
                { backgroundColor: colour, opacity: day < 5 ? 1 : 0.48 },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }
  return <Text style={[modeIconStyles.puzzle, { color: colour }]}>▶</Text>;
}
const modeIconStyles = StyleSheet.create({
  calendar: {
    width: 32,
    height: 32,
    borderWidth: 2.5,
    borderRadius: 7,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 1,
    overflow: 'hidden',
  },
  calendarTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 7 },
  calendarRings: {
    position: 'absolute',
    top: -3,
    left: 7,
    right: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ring: { width: 3, height: 8, borderRadius: 2, backgroundColor: '#fff' },
  check: { fontSize: 19, fontWeight: '900', lineHeight: 21 },
  weekCalendar: {
    width: 34,
    height: 32,
    borderWidth: 2,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
  },
  weekHeader: { width: '100%', height: 6 },
  weekGrid: {
    width: 28,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignContent: 'center',
    justifyContent: 'center',
  },
  weekCell: { width: 5, height: 5, borderRadius: 1.5 },
  puzzle: { fontSize: 32, width: 42, textAlign: 'center' },
});
const MODE_BORDERS = {
  dark: ['#5CFFE0', '#E7B1FF', '#FFF06B', '#85E1FF'],
  light: ['#16876f', '#7953c1', '#ba7c14', '#3477b5'],
} as const;
const TOOLS: Record<Power, { name: string; help: string; colour: string }> = {
  undo: { name: 'Undo', help: 'Take back your last pour.', colour: '#E3A0FF' },
  bottle: {
    name: 'Extra bottle',
    help: 'Make a little more space. Up to two extra bottles per puzzle.',
    colour: '#5CFFE0',
  },
  reveal: { name: 'Reveal', help: 'Uncover every hidden colour.', colour: '#85E1FF' },
  remove: {
    name: 'Colour pop',
    help: 'Tap a bottle to remove its top colour everywhere.',
    colour: '#FF70B5',
  },
};
function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const p = useAppearance();
  const s = useMemo(() => makeStyles(p), [p]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.button, secondary && s.secondary, disabled && { opacity: 0.55 }]}
    >
      <Text style={[s.buttonText, secondary && { color: p.text }]}>{label}</Text>
    </Pressable>
  );
}

function powerAvailable(id: Power, game: Game): boolean {
  if (solved(game.board)) return false;
  if (id === 'undo') return game.history.length > 0;
  if (id === 'bottle') return game.board.length < game.initial.length + 2;
  if (id === 'reveal') return game.board.some((bottle) => bottle.hidden.length > 0);
  return game.board.some((bottle) => bottle.water.length > 0);
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
  const count = reduced ? 0 : Math.min(12, 3 + completedBottles + rating);
  const colours = ['#FFF06B', '#5CFFE0', '#E3A0FF', '#FF70B5', '#85E1FF'];
  useEffect(() => {
    burst.stopAnimation();
    burst.setValue(reduced ? 1 : 0);
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
    <View style={{ width: 240, height: 142, alignSelf: 'center', alignItems: 'center' }}>
      {[0, 1, 2].map((ring) => {
        const start = ring * 0.13;
        return (
          <Animated.View
            key={`ring-${ring}`}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 19,
              width: 54,
              height: 54,
              borderRadius: 30,
              borderWidth: ring === 0 ? 3 : 2,
              borderColor: ring % 2 ? '#5CFFE0' : '#FFE34D',
              opacity: burst.interpolate({
                inputRange: [0, start + 0.06, start + 0.3, start + 0.68, 1],
                outputRange: [0, 0.85, 0.55, 0, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: burst.interpolate({
                    inputRange: [0, start + 0.05, start + 0.68, 1],
                    outputRange: [0.5, 0.75, 2.2, 2.2],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }}
          />
        );
      })}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 22,
          width: 48,
          height: 48,
          borderRadius: 28,
          borderWidth: 3,
          borderColor: '#FFF2A1',
          backgroundColor: '#472891',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: burst.interpolate({ inputRange: [0, 0.1, 0.25, 1], outputRange: [0, 1, 1, 1] }),
          transform: [
            {
              scale: burst.interpolate({
                inputRange: [0, 0.16, 0.28, 1],
                outputRange: [0.35, 1.22, 1, 1],
              }),
            },
            {
              rotate: burst.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: ['-18deg', '5deg', '0deg'],
              }),
            },
          ],
        }}
      >
        <Text style={{ color: '#5CFFE0', fontSize: 29, fontWeight: '900', lineHeight: 34 }}>✓</Text>
      </Animated.View>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2 + (i % 2 ? 0.16 : -0.08);
        const distance = 74 + (i % 3) * 13 + completedBottles * 1.5;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '50%',
              top: 47,
              width: 16,
              height: 20,
              marginLeft: -8,
              marginTop: -10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: burst.interpolate({
                inputRange: [0, 0.18, 0.6, 1],
                outputRange: [0, 1, 0.9, 0],
              }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, y] }) },
                {
                  rotate: burst.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${i % 2 ? 320 : -250}deg`],
                  }),
                },
                {
                  scale: burst.interpolate({
                    inputRange: [0, 0.2, 0.65, 1],
                    outputRange: [0.2, 1.15, 1, 0.55],
                  }),
                },
              ],
            }}
          >
            <View
              style={{
                width: i % 3 ? 8 : 11,
                height: i % 3 ? 13 : 11,
                borderRadius: i % 3 ? 3 : 6,
                backgroundColor: colours[i % colours.length],
                borderWidth: 1,
                borderColor: '#ffffffb0',
              }}
            />
          </Animated.View>
        );
      })}
      <View style={{ position: 'absolute', top: 91, flexDirection: 'row', gap: 6 }}>
        {[0, 1, 2].map((star) => (
          <Animated.Text
            key={star}
            style={{
              color: star < rating ? '#FFE34D' : '#8879AB',
              fontSize: 28,
              fontWeight: '900',
              opacity: burst.interpolate({
                inputRange: [0, 0.34 + star * 0.1, 0.48 + star * 0.1, 1],
                outputRange: [0.5, 0.5, 1, 1],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  scale: burst.interpolate({
                    inputRange: [0, 0.34 + star * 0.1, 0.48 + star * 0.1, 1],
                    outputRange: [0.65, 0.65, 1.25, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }}
          >
            ★
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}
function PourAnimationTest({ shape, reduced }: { shape: number; reduced: boolean }) {
  const [motion] = useState(() => new Animated.Value(0));
  const before: BottleState = { water: [1, 2, 2], hidden: [], lock: null };
  const after: BottleState = { water: [1], hidden: [], lock: null };
  const targetBefore: BottleState = { water: [3], hidden: [], lock: null };
  const targetAfter: BottleState = { water: [3, 2, 2], hidden: [], lock: null };
  const flight: Flight = {
    source: { x: 24, y: 120 },
    target: { x: 174, y: 132 },
    width: 88,
    height: 145,
    boardWidth: 300,
    before,
    after,
    targetBefore,
    targetAfter,
    shape,
    reduced,
    motion,
  };
  return (
    <View style={{ width: 300, height: 315, alignSelf: 'center' }}>
      <View style={{ position: 'absolute', left: 24, top: 120 }}>
        <BottleArt bottle={before} width={88} height={145} shape={shape} />
      </View>
      <View style={{ position: 'absolute', left: 174, top: 132 }}>
        <BottleArt bottle={targetBefore} width={88} height={145} shape={shape} />
      </View>
      <PourFlight
        flight={flight}
        onPourStart={() => undefined}
        onTransfer={() => undefined}
        onComplete={() => undefined}
      />
    </View>
  );
}
function BottleEffectTest({
  kind,
  shape,
  reduced,
}: {
  kind: 'landing' | 'complete' | 'invalid';
  shape: number;
  reduced: boolean;
}) {
  const source: BottleState = { water: [1, 2, 2], hidden: [], lock: null };
  const [target, setTarget] = useState<BottleState>(() => ({
    water: kind === 'complete' ? [2, 2, 2] : [3],
    hidden: [],
    lock: null,
  }));
  const [invalidTrigger, setInvalidTrigger] = useState(0);
  useEffect(() => {
    if (kind === 'invalid') {
      const timer = setTimeout(() => setInvalidTrigger(1), reduced ? 0 : 350);
      return () => clearTimeout(timer);
    }
    const after: BottleState = {
      water: kind === 'complete' ? [2, 2, 2, 2] : [3, 2, 2],
      hidden: [],
      lock: null,
    };
    const timer = setTimeout(() => setTarget(after), reduced ? 0 : 650);
    return () => clearTimeout(timer);
  }, [kind, reduced]);
  const ignoreLayout = () => undefined;
  return (
    <View
      style={{
        height: 230,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 30,
        paddingBottom: 18,
      }}
    >
      <Bottle
        bottle={source}
        index={0}
        selected={false}
        ghost={false}
        target={false}
        width={78}
        height={132}
        shape={shape}
        invalidTrigger={kind === 'invalid' ? invalidTrigger : 0}
        onPress={() => undefined}
        onLayout={ignoreLayout}
      />
      <Bottle
        bottle={target}
        index={1}
        selected={false}
        ghost={false}
        target={false}
        width={78}
        height={132}
        shape={shape}
        onPress={() => undefined}
        onLayout={ignoreLayout}
      />
    </View>
  );
}

function StreakMeter({ count, total }: { count: number; total: number }) {
  const [pulse] = useState(() => new Animated.Value(1));
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current) {
      pulse.setValue(1.16);
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 18 }).start();
    }
    previous.current = count;
  }, [count, pulse]);
  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ scale: pulse }], gap: 8 }}>
      <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
        {count} / {total}
      </Text>
      <View style={{ width: 130, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
        {Array.from({ length: Math.min(total, 6) }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              maxWidth: 26,
              height: 8,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: index < count ? '#8CFFE6' : '#755BB0',
              backgroundColor: index < count ? '#14D9AE' : '#261947',
            }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function CompletionChain({
  from,
  to,
  onDone,
}: {
  from: LayoutRectangle;
  to: LayoutRectangle;
  onDone: () => void;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 460, useNativeDriver: true }),
      Animated.delay(70),
    ]);
    animation.start(({ finished }) => finished && onDoneRef.current());
    return () => animation.stop();
  }, [progress]);
  return (
    <Animated.View
      pointerEvents="none"
      testID="completion-chain-pulse"
      style={{
        position: 'absolute',
        left: from.x + from.width / 2 - 9,
        top: from.y + from.height / 2 - 9,
        width: 18,
        height: 18,
        borderRadius: 12,
        backgroundColor: '#FFE34D',
        borderWidth: 3,
        borderColor: '#fff5a8',
        opacity: progress.interpolate({
          inputRange: [0, 0.12, 0.85, 1],
          outputRange: [0, 1, 1, 0],
        }),
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, to.x - from.x + (to.width - from.width) / 2],
            }),
          },
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, to.y - from.y + (to.height - from.height) / 2],
            }),
          },
          {
            scale: progress.interpolate({
              inputRange: [0, 0.12, 0.5, 1],
              outputRange: [0.4, 1, 1.25, 0.6],
            }),
          },
        ],
      }}
    />
  );
}

function LevelTransitionTest({ shape }: { shape: number }) {
  const [trigger, setTrigger] = useState(0);
  const noopLayout = () => undefined;
  const bottle: BottleState = { water: [1, 2], hidden: [], lock: null };
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        minHeight: 170,
      }}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Bottle
          key={index}
          bottle={bottle}
          index={index}
          selected={false}
          ghost={false}
          target={false}
          width={52}
          height={94}
          shape={shape}
          onPress={() => undefined}
          onLayout={noopLayout}
          entranceTrigger={trigger}
        />
      ))}
      <Button label="Replay" onPress={() => setTrigger((value) => value + 1)} />
    </View>
  );
}

function CompletionChainTest() {
  const [replay, setReplay] = useState(0);
  const from: LayoutRectangle = { x: 18, y: 80, width: 70, height: 110 };
  const to: LayoutRectangle = { x: 208, y: 80, width: 70, height: 110 };
  return (
    <View style={{ width: 300, height: 210, alignSelf: 'center' }}>
      <View
        style={{
          position: 'absolute',
          left: 18,
          top: 80,
          width: 70,
          height: 110,
          borderRadius: 24,
          borderWidth: 3,
          borderColor: '#42e9c5',
          backgroundColor: '#554186',
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 208,
          top: 80,
          width: 70,
          height: 110,
          borderRadius: 24,
          borderWidth: 3,
          borderColor: '#b36cff',
          backgroundColor: '#554186',
        }}
      />
      <CompletionChain key={replay} from={from} to={to} onDone={() => undefined} />
      <Button label="Replay" onPress={() => setReplay((value) => value + 1)} />
    </View>
  );
}

function StreakTest() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (count >= 5) return;
    const timer = setTimeout(() => setCount((value) => value + 1), 550);
    return () => clearTimeout(timer);
  }, [count]);
  return <StreakMeter count={count} total={5} />;
}

export default function SortScreen() {
  const feedback = useFeedback();
  const ads = useAds();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode =
    params.mode === 'challenge' ? 'relaxed' : MODES.find((m) => m.id === params.mode)?.id;
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [boardAreaHeight, setBoardAreaHeight] = useState(0);
  const p = DARK;
  const s = useMemo(() => makeStyles(p), [p]);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [interactionLocked, setInteractionsLocked] = useState(false);
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
  const [reviewPending, setReviewPending] = useState(false);
  const [animationTest, setAnimationTest] = useState<
    | 'menu'
    | 'pour'
    | 'landing'
    | 'complete'
    | 'win'
    | 'chain'
    | 'streak'
    | 'invalid'
    | 'transition'
    | null
  >(null);
  const [animationTestReplay, setAnimationTestReplay] = useState(0);
  const [sheet, setSheet] = useState<
    'settings' | 'closet' | 'backgrounds' | 'intro' | Power | null
  >(null);
  const [backgroundPage, setBackgroundPage] = useState(0);
  const [message, setMessage] = useState('');
  const [invalidMove, setInvalidMove] = useState<{ index: number; revision: number } | null>(null);
  const invalidRevision = useRef(0);
  const [entranceTrigger, setEntranceTrigger] = useState(0);
  const [completionChain, setCompletionChain] = useState<{
    from: LayoutRectangle;
    to: LayoutRectangle;
    id: number;
  } | null>(null);
  const chainRevision = useRef(0);
  const [removing, setRemoving] = useState(false);
  const busy = useRef(false);
  const lifeBusy = useRef(false);
  const failureHandled = useRef(new Set<string>());
  const [lifeAdLoading, setLifeAdLoading] = useState(false);
  const [lifeAction, setLifeAction] = useState<'exit' | 'restart' | null>(null);
  const [lifeActionBusy, setLifeActionBusy] = useState(false);

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
            feedback.configure(p);
            setFlight(null);
            setQueuedFlight(null);
            queuedFlightRef.current = null;
            setPouring(null);
            setTransferred(false);
            setSelected(null);
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
        setInteractionsLocked(false);
        activeMode.current = undefined;
      };
    }, [mode, setWin, setMessage, setSheet, setRemoving, feedback]),
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
    const refresh = () =>
      setProgress((p) =>
        p ? { ...rollover(p, new Date()), lives: refreshLives(p.lives, Date.now()) } : p,
      );
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
  useEffect(() => {
    if (!reviewPending || win || ads.showing) return;
    const timer = setTimeout(() => {
      setReviewPending(false);
      void (async () => {
        if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
      })().catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, [ads.showing, reviewPending, win]);
  const game = mode ? (progress?.games[mode] ?? win) : undefined;
  const noLegalMoves = !!game && !solved(game.board) && legalMoves(game.board).length === 0;
  useEffect(() => {
    if (!progress || !game || !noLegalMoves) return;
    const attemptId = `${game.mode}:${game.level}:${game.seed}:${game.attempt ?? 0}`;
    if (failureHandled.current.has(attemptId)) return;
    failureHandled.current.add(attemptId);
    const next = { ...progress, lives: loseLife(progress.lives, attemptId, Date.now()) };
    if (next.lives !== progress.lives) {
      void Promise.resolve().then(() => {
        feedback.cue('invalid');
        setProgress(next);
        return save(next);
      }).catch(() => setError('Could not save the lost life. Please retry saving.'));
    }
  }, [feedback, game, noLegalMoves, progress]);
  async function watchLife() {
    if (!progress || lifeBusy.current || progress.lives.count >= MAX_LIVES) return;
    lifeBusy.current = true;
    setLifeAdLoading(true);
    try {
      await ads.watch(async (transaction) => {
        const latest = await load();
        const now = Date.now();
        const nextLives = grantLife(refreshLives(latest.lives, now), transaction, now);
        if (nextLives === latest.lives) return;
        const next = { ...latest, lives: nextLives };
        setProgress(next);
        await save(next);
      });
    } catch {
      setError('The extra life could not be saved. Please try again.');
    } finally {
      lifeBusy.current = false;
      setLifeAdLoading(false);
    }
  }
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!mode) return false;
      if (lifeAction) return true;
      setLifeAction('exit');
      return true;
    });
    return () => subscription.remove();
  }, [lifeAction, mode]);
  function open(id: Mode) {
    if (!progress) return;
    const current = refreshLives(progress.lives, clockNow());
    if (!current.count) {
      setProgress({ ...progress, lives: current });
      setMessage('No lives left. Tap the heart to watch an ad for one more.');
      return;
    }
    setMessage('');
    setProgress(enter(rollover({ ...progress, lives: current }, new Date()), id));
    router.push({ pathname: '/', params: { mode: id } });
  }
  async function transition(action: () => void, source: Progress | null = progress) {
    if (busy.current || !source) return;
    busy.current = true;
    setInteractionsLocked(true);
    const expectedSession = session.current;
    try {
      const rewardedThisCompletion = source.ads.rewardAtCompletion === source.completed - 1;
      if (source.ads.interstitialPending && !rewardedThisCompletion) {
        if (await ads.betweenLevels()) {
          const next = { ...source, ads: { ...source.ads, interstitialPending: false } };
          await save(next);
          setProgress(next);
        } else {
          // Keep the due impression through this transition and retry at the next safe one.
          await save(source);
        }
      }
      if (session.current === expectedSession) action();
    } catch {
      setError('Could not save progress. Please try again.');
    } finally {
      if (session.current === expectedSession) {
        busy.current = false;
        setInteractionsLocked(false);
      }
    }
  }
  async function leaveToMenu(source: Progress | null = progress) {
    await transition(() => {
      setWin(null);
      router.replace('/');
    }, source);
  }
  function home() {
    if (win || !mode || !game) {
      void leaveToMenu();
      return;
    }
    setLifeAction('exit');
  }
  async function confirmLifeAction() {
    if (!lifeAction || !progress || !game || !mode || busy.current || lifeActionBusy) return;
    const action = lifeAction;
    setLifeActionBusy(true);
    try {
      let next = progress;
      if (!win && progress.lives.count > 0) {
        const actionId = `player-${action}:${mode}:${game.level}:${game.seed}:${game.attempt ?? 0}`;
        next = { ...progress, lives: loseLife(progress.lives, actionId, clockNow()) };
        await save(next);
        setProgress(next);
      }
      if (action === 'exit') {
        setLifeAction(null);
        await leaveToMenu(next);
        return;
      }
      setLifeAction(null);
      setSelected(null);
      setRemoving(false);
      setEntranceTrigger((value) => value + 1);
      const restarted = commit(resetGame(game), undefined, next);
      if (restarted) {
        await save(restarted);
      }
    } catch {
      setError('Could not save the life change. Please try again.');
    } finally {
      setLifeActionBusy(false);
    }
  }
  function dismissIntro() {
    if (progress) setProgress({ ...progress, onboarded: true });
    setSheet(null);
  }
  function commit(next: Game, spent?: Power, source: Progress | null = progress) {
    if (!mode || !source) return null;
    let p = {
      ...source,
      games: { ...source.games, [mode]: next },
      inventory: { ...source.inventory },
    };
    if (spent) p.inventory[spent]--;
    if (solved(next.board)) {
      feedback.cue('win');
      setWin(next);
      p = finish(p, mode);
      if (p.completed > source.completed) {
        void recordCompletedRun(`${next.mode}:${next.level}:${next.seed}`)
          .then((shouldRequest) => {
            if (shouldRequest) setReviewPending(true);
          })
          .catch(() => undefined);
      }
    } else if (game && next.moves > game.moves) {
      const newlyFinished = next.board.some((b, i) => complete(b) && !complete(game.board[i]));
      feedback.cue(newlyFinished ? 'bottle' : 'settle');
      if (newlyFinished) {
        const fromIndex = next.board.findIndex((b, i) => complete(b) && !complete(game.board[i]));
        const toIndex = next.board.findIndex((b, i) => i !== fromIndex && !complete(b) && !b.lock);
        const from = positions.current[fromIndex];
        const to = positions.current[toIndex];
        if (from && to) setCompletionChain({ from, to, id: ++chainRevision.current });
      }
    }
    setProgress(p);
    return p;
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
    if (!game || win || noLegalMoves || !progress?.lives.count) return;
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
      setInvalidMove({ index, revision: ++invalidRevision.current });
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
    setInteractionsLocked(true);
    setSelected(null);
    setPouring(move);
    setTransferred(false);
    setFlight(nextFlight);
    setMessage('');
  }

  function power(id: Power) {
    if (
      !game ||
      !progress ||
      !progress.lives.count ||
      noLegalMoves ||
      busy.current ||
      win ||
      !powerAvailable(id, game)
    )
      return;
    if (!progress.inventory[id]) {
      busy.current = true;
      setInteractionsLocked(true);
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
          if (session.current === expectedSession) {
            busy.current = false;
            setInteractionsLocked(false);
          }
        });
      return;
    }
    setMessage('');
    setSelected(null);
    if (id === 'remove') {
      setRemoving((v) => !v);
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
  const tabletLayout = Math.min(width, height) >= 600;
  const compact = height < 720;
  const showMenuBanner = BANNER_HEIGHT > 0 && !compact;
  const toolSize = Math.min(tabletLayout ? 74 : 62, (width - 64) / 5);
  const boardWidth = Math.min(width - 36, tabletLayout ? 600 : 480);
  const cols = game ? Math.min(5, Math.ceil(game.board.length / 2)) : 4;
  const rows = game ? Math.ceil(game.board.length / cols) : 2;
  const bottleWidth = Math.min(tabletLayout ? 105 : 85, (boardWidth - 8 * (cols - 1)) / cols);
  const availableBottleHeight =
    boardAreaHeight > 0
      ? (boardAreaHeight - 8 - 8 * (rows - 1) - 52 * rows) / rows
      : (height - 430) / rows;
  const bottleHeight = Math.max(36, Math.min(tabletLayout ? 180 : 145, availableBottleHeight));
  return (
    <AppearanceContext.Provider value={p}>
      <StatusBar style="light" />
      <LinearGradient colors={theme} style={{ flex: 1 }} testID="app-background">
        <SceneDecor background={background} />
        {!mode && <HomeArtifacts colours={p.icons} />}
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
            <View style={[s.home, { maxWidth: tabletLayout ? 520 : 480, gap: compact ? 14 : 20 }]}>
              <View style={s.top}>
                <Text style={s.brand}>PIXEL PULSE</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <LivesMeter
                    lives={progress.lives}
                    onPress={() => void watchLife()}
                    loading={lifeAdLoading || ads.showing}
                    compact
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Make it yours: backgrounds and bottle shapes"
                    onPress={() => setSheet('closet')}
                    style={({ pressed }) => [s.topAction, pressed && { opacity: 0.7 }]}
                  >
                    <Text style={{ fontSize: 26, color: p.text, lineHeight: 30 }}>✿</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Settings"
                    onPress={() => setSheet('settings')}
                    style={({ pressed }) => [s.topAction, pressed && { opacity: 0.7 }]}
                  >
                    <Image
                      source={require('../../../assets/icons/settings.png')}
                      accessible={false}
                      resizeMode="contain"
                      style={{ width: 24, height: 24, tintColor: p.text }}
                    />
                  </Pressable>
                </View>
              </View>
              <View style={[s.hero, { paddingVertical: compact ? 8 : 22 }]}>
                <Image
                  source={require('../../../assets/branding/bottle-mark.png')}
                  accessible={false}
                  resizeMode="contain"
                  style={{
                    width: tabletLayout ? 112 : compact ? 68 : 94,
                    height: tabletLayout ? 112 : compact ? 68 : 94,
                    marginBottom: 4,
                  }}
                />
                <Text
                  style={[s.title, compact && { fontSize: 34 }, tabletLayout && { fontSize: 54 }]}
                >
                  sort & roll<Text style={{ color: p.accent }}>.</Text>
                </Text>
              </View>
              <View style={{ gap: tabletLayout ? 12 : compact ? 7 : 9 }}>
                {MODES.map((m, index) => {
                  const done =
                    (m.id === 'daily' && progress.dailyDone) ||
                    (m.id === 'weekly' && progress.weeklyLevel > 99);
                  const badge =
                    m.id === 'daily'
                      ? done
                        ? '1/1'
                        : '0/1'
                      : m.id === 'weekly'
                        ? `${Math.min(99, progress.weeklyLevel)}/99`
                        : `#${progress.levels[m.id]}`;
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="button"
                      accessibilityLabel={m.name}
                      accessibilityState={{ disabled: done || !progress.lives.count }}
                      disabled={done || !progress.lives.count}
                      onPress={() => open(m.id)}
                      style={[
                        s.card,
                        {
                          backgroundColor: '#1D1244E8',
                          borderColor: MODE_BORDERS[p.dark ? 'dark' : 'light'][index],
                          borderWidth: 2,
                          paddingVertical: tabletLayout ? 16 : compact ? 10 : 12,
                          opacity: done || !progress.lives.count ? 0.55 : 1,
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: tabletLayout ? 54 : 42,
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: [{ scale: tabletLayout ? 1.2 : 1 }],
                        }}
                      >
                        <ModeIcon mode={m.id} colour={p.icons[index]} />
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
                        <Text style={[s.cardTitle, tabletLayout && { fontSize: 23 }]}>
                          {m.name}
                        </Text>
                        {!!m.text && (
                          <Text style={[s.cardText, tabletLayout && { fontSize: 14 }]}>
                            {m.text}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          s.badge,
                          { color: p.icons[index] },
                          tabletLayout && { fontSize: 24 },
                        ]}
                      >
                        {badge}
                      </Text>
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
                  <Text style={{ color: p.accent, fontSize: 18, fontWeight: '900' }}>?</Text>
                </Pressable>
              )}
              {showMenuBanner && (
                <View
                  testID="banner-placement"
                  style={{
                    height: BANNER_HEIGHT,
                    width: '100%',
                    marginTop: 'auto',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AdBanner />
                </View>
              )}
            </View>
          ) : game ? (
            <View style={[s.game, tabletLayout && { maxWidth: 660 }]}>
              <View style={s.top}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to menu"
                  onPress={home}
                  style={s.topAction}
                >
                  <Image
                    source={require('../../../assets/icons/back.png')}
                    accessible={false}
                    resizeMode="contain"
                    style={{ width: 24, height: 24, tintColor: p.text }}
                  />
                </Pressable>
                <Text style={s.topLevel}>
                  {mode === 'daily'
                    ? 'Daily challenge'
                    : `Level ${game.level < 10 ? '0' : ''}${game.level}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <LivesMeter
                    lives={progress.lives}
                    onPress={() => void watchLife()}
                    loading={lifeAdLoading || ads.showing}
                    compact
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Restart puzzle"
                    disabled={!progress.lives.count || noLegalMoves}
                    onPress={() => {
                      if (!busy.current && !win) setLifeAction('restart');
                    }}
                    style={[s.topAction, (!progress.lives.count || noLegalMoves) && { opacity: 0.45 }]}
                  >
                    <Image
                      source={require('../../../assets/icons/restart.png')}
                      accessible={false}
                      resizeMode="contain"
                      style={{ width: 24, height: 24, tintColor: p.text }}
                    />
                  </Pressable>
                </View>
              </View>
              <View style={s.levelHeading}>
                <StreakMeter
                  count={game.board.filter(complete).length}
                  total={new Set(game.initial.flatMap((bottle) => bottle.water)).size}
                />
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
                      ghost={pouring?.[0] === i}
                      target={pouring?.[1] === i}
                      width={bottleWidth}
                      height={bottleHeight}
                      shape={progress.shape}
                      invalidTrigger={invalidMove?.index === i ? invalidMove.revision : 0}
                      entranceTrigger={entranceTrigger}
                      onPress={() => tap(i)}
                      onLayout={(rect) => {
                        positions.current[i] = rect;
                      }}
                    />
                  ))}
                  {completionChain && (
                    <CompletionChain
                      key={completionChain.id}
                      from={completionChain.from}
                      to={completionChain.to}
                      onDone={() =>
                        setCompletionChain((current) =>
                          current?.id === completionChain.id ? null : current,
                        )
                      }
                    />
                  )}
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
                          setInteractionsLocked(false);
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
                  {POWERS.filter((id) => !!game && powerAvailable(id, game)).map((id) => {
                    const enabled = !interactionLocked && !win && !noLegalMoves && !!progress.lives.count;
                    return (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !enabled }}
                        accessibilityLabel={`${TOOLS[id].name}, ${progress.inventory[id]} remaining${progress.inventory[id] ? '' : ', watch ad for one charge'}`}
                        disabled={!enabled}
                        onPress={() => power(id)}
                        onLongPress={() => setSheet(id)}
                        style={[
                          s.tool,
                          removing && id === 'remove' && { backgroundColor: p.secondary },
                          !enabled && { opacity: 0.55 },
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
                          <View
                            style={[
                              s.counter,
                              { backgroundColor: TOOLS[id].colour },
                              !progress.inventory[id] && s.counterAd,
                            ]}
                          >
                            <Text style={[s.counterText, !progress.inventory[id] && s.counterAdText]}>
                              {progress.inventory[id] ? progress.inventory[id] : 'AD +1'}
                            </Text>
                          </View>
                        </View>
                        <Text style={s.toolLabel}>{TOOLS[id].name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
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
                <Text style={[s.level, compact && { fontSize: 24 }]}>Sorted!</Text>
                <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                  {win
                    ? `${'★'.repeat(stars(win))}${'☆'.repeat(3 - stars(win))}  ·  ${win.moves}`
                    : ''}
                </Text>
                <Button
                  label={
                    mode === 'daily' || (mode === 'weekly' && progress.weeklyLevel > 99)
                      ? 'Done'
                      : 'Next'
                  }
                  onPress={() => {
                    if (mode === 'daily' || (mode === 'weekly' && progress.weeklyLevel > 99))
                      home();
                    else if (mode)
                      void transition(() => {
                        setWin(null);
                        setSelected(null);
                        setMessage('');
                        setProgress((current) =>
                          current
                            ? enter(
                                {
                                  ...current,
                                  ads: { ...current.ads },
                                },
                                mode,
                              )
                            : current,
                        );
                        setEntranceTrigger((value) => value + 1);
                      });
                  }}
                />
                <Button secondary label="Menu" onPress={home} />
              </View>
            </View>
          </Modal>
          <Modal
            visible={!!game && !win && !!mode && lifeAction === null && !interactionLocked && (!progress.lives.count || noLegalMoves)}
            transparent
            animationType="fade"
            onRequestClose={() => undefined}
          >
            <View style={s.overlay}>
              <View style={[s.sheet, { gap: 14 }]} testID="lives-blocker">
                <Text style={[s.level, compact && { fontSize: 24 }]}>
                  {noLegalMoves ? 'No moves left' : 'Out of lives'}
                </Text>
                <LivesMeter
                  lives={progress.lives}
                  onPress={() => void watchLife()}
                  loading={lifeAdLoading || ads.showing}
                />
                <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                  {noLegalMoves
                    ? 'This puzzle is stuck. Retry when you have a life.'
                    : 'Your next life restores automatically. Watch an ad to get one now.'}
                </Text>
                {progress.lives.count > 0 && noLegalMoves && (
                  <Button label="Retry puzzle" onPress={() => setLifeAction('restart')} />
                )}
                <Button
                  secondary
                  label={lifeAdLoading || ads.showing ? 'Loading ad…' : 'Watch ad for a life'}
                  onPress={() => void watchLife()}
                />
                <Button secondary label="Menu" onPress={home} />
              </View>
            </View>
          </Modal>
          <Modal
            visible={lifeAction !== null}
            transparent
            animationType="fade"
                  onRequestClose={() => { if (!lifeActionBusy) setLifeAction(null); }}
          >
            <View style={s.overlay}>
              <View style={[s.sheet, { gap: 14 }]} testID="life-action-confirmation">
                <Text style={[s.level, compact && { fontSize: 24 }]}>
                  {lifeAction === 'restart' ? 'Restart puzzle?' : 'Leave this game?'}
                </Text>
                <LivesMeter
                  lives={progress.lives}
                  onPress={() => void watchLife()}
                  loading={lifeAdLoading || ads.showing}
                />
                <Text style={[s.body, compact && { fontSize: 11, lineHeight: 16 }]}>
                  {win
                    ? 'This puzzle is complete. Leaving won’t use a life.'
                    : progress.lives.count > 0
                    ? `You’ll spend 1 life to ${lifeAction === 'restart' ? 'restart this puzzle' : 'leave this game'}.${lifeAction === 'restart' && progress.lives.count === 1 ? ' The puzzle will restart, then wait until you have a life to continue.' : ''}`
                    : 'You have no lives left, so this won’t use another one.'}
                </Text>
                <Button
                  label={!win && progress.lives.count > 0 ? `Use 1 life & ${lifeAction === 'restart' ? 'restart' : 'leave'}` : lifeAction === 'restart' ? 'Return to menu' : 'Leave game'}
                  disabled={lifeActionBusy}
                  onPress={() => void confirmLifeAction()}
                />
                <Button secondary label="Keep playing" onPress={() => { if (!lifeActionBusy) setLifeAction(null); }} />
              </View>
            </View>
          </Modal>
          <Modal
            visible={animationTest !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setAnimationTest(null)}
          >
            <View style={s.overlay}>
              <View style={[s.sheet, { gap: 12 }]}>
                {animationTest === 'menu' ? (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>Animation tests</Text>
                    <ScrollView
                      style={{ maxHeight: compact ? 420 : 540 }}
                      contentContainerStyle={{ gap: 9 }}
                    >
                      <Button
                        secondary
                        label="Pour + droplets"
                        onPress={() => setAnimationTest('pour')}
                      />
                      <Button
                        secondary
                        label="Liquid slosh"
                        onPress={() => setAnimationTest('landing')}
                      />
                      <Button
                        secondary
                        label="Bottle cap"
                        onPress={() => setAnimationTest('complete')}
                      />
                      <Button
                        secondary
                        label="Completion chain"
                        onPress={() => setAnimationTest('chain')}
                      />
                      <Button
                        secondary
                        label="Bottle progress"
                        onPress={() => setAnimationTest('streak')}
                      />
                      <Button
                        secondary
                        label="Invalid move"
                        onPress={() => setAnimationTest('invalid')}
                      />
                      <Button
                        secondary
                        label="Level transition"
                        onPress={() => setAnimationTest('transition')}
                      />
                      <Button
                        secondary
                        label="Win celebration"
                        onPress={() => setAnimationTest('win')}
                      />
                    </ScrollView>
                    <Button label="Done" onPress={() => setAnimationTest(null)} />
                  </>
                ) : (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>
                      {animationTest === 'pour'
                        ? 'Pour + droplets'
                        : animationTest === 'landing'
                          ? 'Liquid slosh'
                          : animationTest === 'complete'
                            ? 'Bottle cap'
                            : animationTest === 'chain'
                              ? 'Completion chain'
                              : animationTest === 'streak'
                                ? 'Bottle progress'
                                : animationTest === 'invalid'
                                  ? 'Invalid move'
                                  : animationTest === 'transition'
                                    ? 'Level transition'
                                    : 'Win celebration'}
                    </Text>
                    {animationTest === 'pour' ? (
                      <PourAnimationTest
                        key={animationTestReplay}
                        shape={progress.shape}
                        reduced={reduced}
                      />
                    ) : animationTest === 'landing' || animationTest === 'complete' ? (
                      <BottleEffectTest
                        key={`${animationTest}-${animationTestReplay}`}
                        kind={animationTest}
                        shape={progress.shape}
                        reduced={reduced}
                      />
                    ) : animationTest === 'invalid' ? (
                      <BottleEffectTest
                        key={`${animationTest}-${animationTestReplay}`}
                        kind="invalid"
                        shape={progress.shape}
                        reduced={reduced}
                      />
                    ) : animationTest === 'chain' ? (
                      <CompletionChainTest key={animationTestReplay} />
                    ) : animationTest === 'streak' ? (
                      <StreakTest key={animationTestReplay} />
                    ) : animationTest === 'transition' ? (
                      <LevelTransitionTest key={animationTestReplay} shape={progress.shape} />
                    ) : (
                      <WinCelebration
                        key={animationTestReplay}
                        completedBottles={5}
                        rating={3}
                        reduced={reduced}
                      />
                    )}
                    <Button
                      secondary
                      label="More animations"
                      onPress={() => setAnimationTest('menu')}
                    />
                    <Button
                      secondary
                      label="Replay"
                      onPress={() => setAnimationTestReplay((value) => value + 1)}
                    />
                    <Button label="Done" onPress={() => setAnimationTest(null)} />
                  </>
                )}
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
                  </>
                ) : sheet === 'settings' ? (
                  <>
                    <Text style={[s.level, compact && { fontSize: 24 }]}>Your little settings</Text>
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
                    <Button
                      secondary
                      label="Rate the app"
                      onPress={() => {
                        setSheet(null);
                        void (async () => {
                          if (await StoreReview.isAvailableAsync()) {
                            await StoreReview.requestReview();
                          }
                        })().catch(() => setError('App rating is unavailable right now.'));
                      }}
                    />
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
                    <Text
                      style={[
                        s.body,
                        { textAlign: 'center', opacity: 0.72 },
                        compact && { fontSize: 11 },
                      ]}
                    >
                      Version {Constants.expoConfig?.version ?? '1.0.4'}
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
      justifyContent: 'flex-start',
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 50,
    },
    topLevel: {
      color: p.text,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
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
    topAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.border,
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
    modeIcon: { fontSize: 32, width: 42, textAlign: 'center' },
    cardTitle: { fontSize: 19, fontWeight: '800', color: p.text },
    cardText: { fontSize: 12, color: p.muted, marginTop: 3, lineHeight: 16 },
    badge: {
      fontSize: 20,
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
      minWidth: 38,
      textAlign: 'right',
    },
    closet: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
      marginTop: 8,
      borderRadius: 18,
      backgroundColor: p.surface,
    },
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
    levelHeading: { alignItems: 'center', paddingTop: 8, marginBottom: 24 },
    level: {
      fontSize: 32,
      fontWeight: '800',
      color: p.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    path: { flexDirection: 'row', gap: 7, justifyContent: 'center', paddingTop: 12 },
    dot: { height: 7, borderRadius: 4 },
    boardArea: {
      flex: 1,
      minHeight: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 4,
    },
    board: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flexShrink: 1,
      justifyContent: 'center',
      gap: 8,
      paddingBottom: 8,
      backgroundColor: '#130D36E8',
      borderColor: '#A075FF88',
      borderWidth: 1.5,
      borderRadius: 26,
      boxShadow: '0px 0px 20px #5CFFE055',
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
      paddingVertical: 4,
      marginBottom: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tools: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      minHeight: 0,
      paddingVertical: 4,
      gap: 5,
    },
    tool: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '18.5%',
      maxWidth: 76,
      borderRadius: 16,
      paddingVertical: 4,
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
      marginTop: 4,
      textAlign: 'center',
      minHeight: 20,
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
    counterAd: { minWidth: 48, height: 22, right: -6, bottom: -5, borderRadius: 11, paddingHorizontal: 5, borderColor: '#FFF2A8' },
    counterAdText: { fontSize: 9, lineHeight: 12, fontWeight: '900' },
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
