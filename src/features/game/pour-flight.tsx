import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import type { Bottle } from '../../engine/game';
import { BottleArt, COLOURS } from './bottle';
import { pourGeometry, type Point } from './pour-geometry';
export type Flight = {
  source: Point;
  target: Point;
  width: number;
  height: number;
  boardWidth: number;
  before: Bottle;
  after: Bottle;
  shape: number;
  reduced: boolean;
  motion: Animated.Value;
  targetBefore: Bottle;
  targetAfter: Bottle;
};
export function PourFlight({
  flight,
  onPourStart,
  onTransfer,
  onComplete,
}: {
  flight: Flight;
  onPourStart: () => void;
  onTransfer: () => void;
  onComplete: () => void;
}) {
  const motion = flight.motion;
  // A modest speed-up keeps the pour expressive without making it feel rushed.
  const duration = 1050 + (flight.before.water.length - flight.after.water.length) * 140;
  const [drained, setDrained] = useState(false);
  const callbacks = useRef({ onPourStart, onTransfer, onComplete });
  useEffect(() => {
    callbacks.current = { onPourStart, onTransfer, onComplete };
  }, [onPourStart, onTransfer, onComplete]);
  useEffect(() => {
    motion.setValue(0);
    setDrained(false);
    if (flight.reduced) {
      callbacks.current.onPourStart();
      callbacks.current.onTransfer();
      callbacks.current.onComplete();
      return;
    }
    const flowTimer = setTimeout(() => callbacks.current.onPourStart(), duration * 0.46);
    const timer = setTimeout(() => {
      setDrained(true);
      callbacks.current.onTransfer();
    }, duration * 0.79);
    const animation = Animated.timing(motion, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) callbacks.current.onComplete();
    });
    return () => {
      clearTimeout(timer);
      clearTimeout(flowTimer);
      animation.stop();
    };
  }, [flight, motion, duration]);
  const p = pourGeometry(
    flight.source,
    flight.target,
    flight.width,
    flight.height,
    flight.boardWidth,
  );
  const phases = [0, 0.14, 0.32, 0.46, 0.8, 1];
  const ink = COLOURS[flight.before.water.at(-1)!];
  const innerHeight = flight.height - 13;
  const surfaceBefore = 19 + (innerHeight * (4 - flight.targetBefore.water.length)) / 4;
  const surfaceAfter = 19 + (innerHeight * (4 - flight.targetAfter.water.length)) / 4;
  const flowOpacity = motion.interpolate({
    inputRange: [0, 0.45, 0.48, 0.77, 0.8, 1],
    outputRange: [0, 0, 1, 1, 0, 0],
  });
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
    >
      <Animated.View
        testID="pour-stream"
        style={{
          position: 'absolute',
          left: p.mouthX - 3.5,
          top: p.mouthY - p.gap,
          width: 7,
          height: p.gap + 3,
          borderRadius: 3,
          backgroundColor: ink,
          opacity: flowOpacity,
        }}
      />
      <Animated.View
        testID="pour-inner-stream"
        style={{
          position: 'absolute',
          left: p.mouthX - 2,
          top: p.mouthY,
          width: 4,
          height: surfaceBefore,
          borderRadius: 3,
          backgroundColor: ink,
          opacity: flowOpacity,
          transformOrigin: 'top',
          transform: [
            {
              scaleY: motion.interpolate({
                inputRange: [0.46, 0.78],
                outputRange: [1, surfaceAfter / surfaceBefore],
                extrapolate: 'clamp',
              }),
            },
          ],
        }}
      />
      <Animated.View
        testID="pour-ripple"
        style={{
          position: 'absolute',
          left: p.mouthX - flight.width * 0.2,
          top: p.mouthY,
          width: flight.width * 0.4,
          height: 5,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: '#ffffffb0',
          backgroundColor: `${ink}88`,
          opacity: flowOpacity,
          transform: [
            {
              translateY: motion.interpolate({
                inputRange: [0.46, 0.78],
                outputRange: [surfaceBefore - 3, surfaceAfter - 3],
                extrapolate: 'clamp',
              }),
            },
            {
              scaleX: motion.interpolate({
                inputRange: [0.46, 0.53, 0.6, 0.67, 0.74, 0.8],
                outputRange: [0.5, 1, 0.7, 1, 0.7, 1],
              }),
            },
          ],
        }}
      />
      <Animated.View
        testID="pour-overlay"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: flight.width * 0.86,
          height: flight.height + 13,
          transform: [
            {
              translateX: motion.interpolate({
                inputRange: phases,
                outputRange: [p.start.x, p.start.x, p.end.x, p.end.x, p.end.x, p.start.x],
              }),
            },
            {
              translateY: motion.interpolate({
                inputRange: phases,
                outputRange: [p.start.y, p.liftY, p.liftY, p.end.y, p.end.y, p.start.y + 14],
              }),
            },
            {
              rotate: motion.interpolate({
                inputRange: phases,
                outputRange: ['0deg', '0deg', '0deg', `${p.angle}deg`, `${p.angle}deg`, '0deg'],
              }),
            },
          ],
        }}
      >
        <BottleArt
          bottle={drained ? flight.after : flight.before}
          width={flight.width}
          height={flight.height}
          shape={flight.shape}
          transfer={{ motion, before: flight.before, after: flight.after }}
        />
      </Animated.View>
    </View>
  );
}
