import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { MAX_LIVES, type Lives } from '../../policies/lives';

function timeUntil(timestamp: number | null, now: number) {
  if (!timestamp || !now) return '—';
  const seconds = Math.max(0, Math.ceil((timestamp - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function LivesMeter({
  lives,
  onPress,
  loading = false,
  compact = false,
}: {
  lives: Lives;
  onPress: () => void;
  loading?: boolean;
  compact?: boolean;
}) {
  const [now, setNow] = useState(0);
  const [pulse] = useState(() => new Animated.Value(1));
  const [showLoss, setShowLoss] = useState(false);
  const previousCount = useRef(lives.count);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (lives.count < previousCount.current) {
      setShowLoss(true);
      pulse.setValue(0.72);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.28, duration: 170, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 18 }),
      ]).start();
      const timer = setTimeout(() => setShowLoss(false), 900);
      previousCount.current = lives.count;
      return () => clearTimeout(timer);
    }
    previousCount.current = lives.count;
  }, [lives.count, pulse]);
  const disabled = loading || lives.count !== 0;
  const remaining = lives.nextLifeAt ? timeUntil(lives.nextLifeAt, now) : '';
  const label =
    lives.count === 0
      ? loading ? 'Loading reward ad' : 'No lives. Tap to watch an ad for one life'
      : lives.count >= MAX_LIVES
        ? `${MAX_LIVES} lives. Full`
        : `Lives ${lives.count} of ${MAX_LIVES}${remaining ? `. Next life in ${remaining}` : ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => { if (lives.count === 0 && !loading) onPress(); }}
      testID="lives-meter"
      style={({ pressed }) => ({
        minHeight: compact ? 42 : 50,
        minWidth: lives.count === 0 ? (compact ? 80 : 88) : compact ? 68 : 76,
        paddingHorizontal: lives.count === 0 ? 8 : 10,
        borderRadius: 24,
        backgroundColor: lives.count === 0 ? 'rgba(55, 34, 91, 0.98)' : 'rgba(35, 15, 70, 0.78)',
        borderWidth: 1,
        borderColor: lives.count === 0 ? '#59EDC7' : 'rgba(210, 170, 255, 0.24)',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          transform: [{ scale: pulse }],
        }}
      >
        {lives.count === 0 ? (
          <>
            <Text allowFontScaling={false} style={{ color: '#FF526F', fontSize: 19, lineHeight: 22, fontWeight: '900', includeFontPadding: false }}>
              ♥
            </Text>
            <Text allowFontScaling={false} style={{ color: '#59EDC7', fontSize: 10, lineHeight: 15, fontWeight: '900' }}>
              {loading ? '…' : '▶'}
            </Text>
            <Text allowFontScaling={false} style={{ color: '#FFF5E8', fontSize: 12, lineHeight: 16, fontWeight: '900', includeFontPadding: false }}>
              {loading ? 'Loading' : 'Ad +1'}
            </Text>
          </>
        ) : (
          <>
            <Text
              allowFontScaling={false}
              style={{
                width: 24,
                textAlign: 'center',
                color: '#FF526F',
                fontSize: 22,
                lineHeight: 26,
                includeFontPadding: false,
                textShadowColor: '#A80D3D',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 2,
              }}
            >
              ♥
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                minWidth: 12,
                textAlign: 'center',
                color: '#FFF5E8',
                fontSize: 15,
                lineHeight: 19,
                fontWeight: '900',
                includeFontPadding: false,
              }}
            >
              {lives.count}
            </Text>
          </>
        )}
      </Animated.View>
      {!compact && (
        <Text style={{ color: '#ddd2f5', fontSize: 10, fontWeight: '700' }}>
          {lives.count === 0 ? '' : showLoss ? '💔 Life lost' : remaining ? `Next in ${remaining}` : ''}
        </Text>
      )}
    </Pressable>
  );
}
