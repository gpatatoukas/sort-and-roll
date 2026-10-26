import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppearance } from './appearance';
import { complete, type Bottle as BottleState } from '../../engine/game';
export const COLOURS = ['#000', '#ff8574', '#a68bf4', '#67cbbd', '#ffce68', '#75aaf5', '#ee91ba'];
export const COLOUR_NAMES = ['', 'coral', 'violet', 'mint', 'gold', 'blue', 'pink'];
export type LiquidTransfer = {
  motion: Animated.Value;
  before: BottleState;
  after: BottleState;
};
export function BottleArt({
  bottle,
  width,
  height,
  shape,
  highlighted = false,
  transfer,
  sealScale,
  ringPulse,
}: {
  bottle: BottleState;
  width: number;
  height: number;
  shape: number;
  highlighted?: boolean;
  transfer?: LiquidTransfer;
  sealScale?: Animated.Value;
  ringPulse?: Animated.Value;
}) {
  const p = useAppearance();
  const edge = highlighted ? p.accent : p.glassEdge;
  const rounded = shape === 2;
  return (
    <View style={{ width: width * 0.86 }}>
      <View
        style={[styles.neck, { width: width * 0.38, borderColor: edge, backgroundColor: p.neck }]}
      >
        <View
          style={{
            position: 'absolute',
            left: -4,
            right: -4,
            top: -2,
            height: 5,
            borderRadius: 3,
            borderWidth: 1.5,
            borderColor: p.glassHighlight,
            backgroundColor: p.neck,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: -3,
            right: -3,
            bottom: 0,
            height: 4,
            borderRadius: 2,
            backgroundColor: p.collar,
          }}
        />
      </View>
      <View
        style={[
          styles.glass,
          {
            height,
            borderColor: edge,
            borderTopLeftRadius: rounded ? width * 0.4 : shape === 1 ? 8 : width * 0.3,
            borderTopRightRadius: rounded ? width * 0.4 : shape === 1 ? 8 : width * 0.3,
            borderBottomLeftRadius: rounded ? width * 0.4 : shape === 1 ? 9 : 15,
            borderBottomRightRadius: rounded ? width * 0.4 : shape === 1 ? 9 : 15,
            backgroundColor: p.glass,
            boxShadow: highlighted ? `0px 0px 18px ${p.glow}` : `0px 7px 16px ${p.shade}`,
          },
        ]}
      >
        <View
          style={[
            styles.liquid,
            {
              borderTopLeftRadius: rounded ? width * 0.3 : shape === 1 ? 4 : width * 0.2,
              borderTopRightRadius: rounded ? width * 0.3 : shape === 1 ? 4 : width * 0.2,
              borderBottomLeftRadius: rounded ? width * 0.3 : 10,
              borderBottomRightRadius: rounded ? width * 0.3 : 10,
            },
          ]}
        >
          {Array.from({ length: 4 }, (_, i) => {
            const position = 3 - i,
              colour = transfer
                ? transfer.before.water[position] || transfer.after.water[position]
                : bottle.water[position];
            const hidden = bottle.hidden.includes(position);
            const ink = hidden ? p.hidden : COLOURS[colour];
            const before = transfer?.before.water.length ?? bottle.water.length;
            const after = transfer?.after.water.length ?? bottle.water.length;
            const changing =
              transfer && position >= Math.min(before, after) && position < Math.max(before, after);
            const order = after > before ? position - before : before - 1 - position;
            const count = Math.abs(after - before);
            const scale = changing
              ? transfer.motion.interpolate({
                  inputRange: [0.46 + (order / count) * 0.32, 0.46 + ((order + 1) / count) * 0.32],
                  outputRange: after > before ? [0, 1] : [1, 0],
                  extrapolate: 'clamp',
                })
              : 1;
            return (
              <View key={position} style={[styles.layer, { borderTopWidth: 0 }]}>
                <Animated.View
                  testID={changing ? `liquid-layer-${position}` : undefined}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    transformOrigin: 'bottom',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scaleY: scale }],
                  }}
                >
                  {colour ? (
                    <LinearGradient
                      colors={[`${ink}cc`, ink, `${ink}d9`]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                  ) : null}
                  {hidden ? (
                    <Text style={styles.question}>?</Text>
                  ) : colour ? (
                    <>
                      <View
                        style={[
                          styles.glint,
                          {
                            height: position === bottle.water.length - 1 ? 3 : 1,
                            backgroundColor:
                              position === bottle.water.length - 1 ? '#ffffff80' : '#ffffff25',
                          },
                        ]}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          right: 9 + (position % 2) * 5,
                          bottom: 7,
                          width: 3,
                          height: 3,
                          borderRadius: 2,
                          borderWidth: 1,
                          borderColor: '#ffffff50',
                        }}
                      />
                    </>
                  ) : null}
                </Animated.View>
              </View>
            );
          })}
        </View>
        <View
          pointerEvents="none"
          style={[styles.reflection, { backgroundColor: p.reflection, width: shape === 1 ? 3 : 4 }]}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 6,
            top: 16,
            bottom: 17,
            width: shape === 1 ? 6 : 2,
            backgroundColor: p.reflection,
            opacity: 0.4,
            borderRadius: 4,
          }}
        />
        {[0.25, 0.5, 0.75].map((at, i) => (
          <View
            key={at}
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 5,
              top: height * at,
              width: i === 1 ? 7 : 4,
              height: 1,
              backgroundColor: p.glassHighlight,
              opacity: 0.6,
            }}
          />
        ))}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 3,
            left: 10,
            right: 10,
            height: 4,
            borderBottomWidth: 1.5,
            borderBottomColor: p.glassHighlight,
            borderRadius: 5,
            opacity: 0.7,
          }}
        />
        {bottle.lock !== null && (
          <View pointerEvents="none" style={styles.lock}>
            <View
              style={[
                styles.lockBadge,
                {
                  backgroundColor: p.dark ? '#102333f2' : '#25334bf2',
                },
              ]}
            >
              <View style={styles.padlock}>
                <View style={[styles.shackle, { borderColor: COLOURS[bottle.lock] }]} />
                <View style={[styles.lockBody, { backgroundColor: COLOURS[bottle.lock] }]}>
                  <View style={styles.keyhole} />
                </View>
              </View>
              <Text style={styles.lockText}>LOCKED</Text>
              <View style={styles.lockNeed}>
                <View
                  style={[
                    styles.lockDrop,
                    {
                      backgroundColor: COLOURS[bottle.lock],
                      borderColor: '#ffffffb8',
                    },
                  ]}
                />
                <Text style={styles.lockNeedText}>
                  {COLOUR_NAMES[bottle.lock].toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        )}
        {complete(bottle) && (
          <>
            {ringPulse && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.sealRipple,
                  {
                    borderColor: COLOURS[bottle.water[0]],
                    opacity: ringPulse.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 0.8, 0],
                    }),
                    transform: [
                      {
                        scale: ringPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.65, 2.6],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
            <Animated.View
              style={[
                styles.seal,
                {
                  backgroundColor: p.dark ? '#233a3aeb' : '#f0fff4e0',
                  borderWidth: 1.5,
                  borderColor: '#91dbb9',
                  transform: sealScale
                    ? [
                        {
                          scale: sealScale.interpolate({
                            inputRange: [0, 0.7, 1],
                            outputRange: [0.5, 1.3, 1],
                          }),
                        },
                      ]
                    : undefined,
                },
              ]}
            >
              <Text style={[styles.tick, { color: p.dark ? '#a4f0c9' : '#4f8276' }]}>✓</Text>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

export function Bottle({
  bottle,
  index,
  selected,
  hinted,
  ghost,
  target,
  width,
  height,
  shape,
  onPress,
  onLayout,
  transfer,
}: {
  bottle: BottleState;
  index: number;
  selected: boolean;
  hinted: boolean;
  ghost: boolean;
  target: boolean;
  width: number;
  height: number;
  shape: number;
  onPress: () => void;
  onLayout: (rect: LayoutRectangle) => void;
  transfer?: LiquidTransfer;
}) {
  const p = useAppearance();
  const [motion] = useState(() => new Animated.Value(0));
  const [sealScale] = useState(() => new Animated.Value(1));
  const [ringPulse] = useState(() => new Animated.Value(0));
  const reduce = useRef(false);
  const wasComplete = useRef(complete(bottle));
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduce.current = v;
    });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      reduce.current = v;
    });
    return () => listener.remove();
  }, []);
  useEffect(() => {
    const animation = Animated.timing(motion, {
      toValue: selected ? -14 : 0,
      duration: reduce.current ? 0 : 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, motion]);
  useEffect(() => {
    const isComplete = complete(bottle);
    if (isComplete && !wasComplete.current) {
      if (reduce.current) {
        sealScale.setValue(1);
        ringPulse.setValue(0);
      } else {
        sealScale.setValue(0);
        ringPulse.setValue(0);
        Animated.parallel([
          Animated.spring(sealScale, {
            toValue: 1,
            friction: 4,
            tension: 150,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ringPulse, {
              toValue: 1,
              duration: 230,
              useNativeDriver: true,
            }),
            Animated.timing(ringPulse, {
              toValue: 0,
              duration: 460,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }
    }
    wasComplete.current = isComplete;
  }, [bottle, ringPulse, sealScale]);
  const description = bottle.water
    .map((c, i) => (bottle.hidden.includes(i) ? 'hidden' : COLOUR_NAMES[c]))
    .join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bottle ${index + 1}: ${bottle.lock ? `locked ${COLOUR_NAMES[bottle.lock]}, ` : ''}${description || 'empty'}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      onLayout={(event) => onLayout(event.nativeEvent.layout)}
      testID={`bottle-${index}`}
      style={{ width, alignItems: 'center', paddingTop: 22, opacity: ghost ? 0 : 1 }}
    >
      <Animated.View style={{ transform: [{ translateY: motion }] }}>
        <BottleArt
          bottle={bottle}
          width={width}
          height={height}
          shape={shape}
          highlighted={selected || hinted}
          transfer={transfer}
          sealScale={sealScale}
          ringPulse={ringPulse}
        />
      </Animated.View>
      <View
        style={[
          styles.shadow,
          { width: width * 0.7, backgroundColor: target ? p.accent : p.shade },
        ]}
      />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  neck: {
    height: 13,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignSelf: 'center',
    backgroundColor: '#ffffff70',
  },
  glass: {
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    padding: 5,
    boxShadow: '0px 7px 16px #67518614',
  },
  liquid: { flex: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  layer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ffffff32',
  },
  glint: {
    position: 'absolute',
    top: 3,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: '#ffffff26',
    borderRadius: 2,
  },
  question: { fontWeight: '800', color: '#fff', fontSize: 18 },
  reflection: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 12,
    width: 4,
    backgroundColor: '#ffffff4d',
    borderRadius: 5,
  },
  shadow: { height: 7, borderRadius: 20, marginTop: 10 },
  lock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#101a2bb8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    minWidth: 58,
    maxWidth: '100%',
    paddingHorizontal: 4,
    paddingVertical: 7,
    borderRadius: 13,
    alignItems: 'center',
    gap: 3,
    boxShadow: '0px 2px 8px #00000080',
  },
  padlock: { width: 23, height: 23, alignItems: 'center', justifyContent: 'flex-end' },
  shackle: {
    position: 'absolute',
    top: 0,
    width: 13,
    height: 12,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockBody: {
    width: 21,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyhole: { width: 3, height: 6, borderRadius: 2, backgroundColor: '#172135' },
  lockText: { fontSize: 8, color: '#fff', fontWeight: '900', letterSpacing: 0.8 },
  lockNeed: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockDrop: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  lockNeedText: { fontSize: 8, color: '#fff', fontWeight: '900', letterSpacing: 0.6 },
  seal: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffffffb0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealRipple: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 2,
  },
  tick: { color: '#4f8276', fontSize: 21, fontWeight: '800' },
});
