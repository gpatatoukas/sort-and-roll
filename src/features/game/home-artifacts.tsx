import { Text, View } from 'react-native';

type BottleShape = 'slim' | 'classic' | 'round';

function GlassBottle({
  colour,
  shape,
  rotate,
}: {
  colour: string;
  shape: BottleShape;
  rotate: string;
}) {
  const width = shape === 'slim' ? 42 : shape === 'round' ? 62 : 52;
  const height = shape === 'slim' ? 108 : shape === 'round' ? 94 : 104;
  const radius = shape === 'round' ? 24 : shape === 'slim' ? 17 : 19;
  return (
    <View
      style={{
        width,
        height,
        opacity: 0.48,
        transform: [{ rotate }],
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: width * 0.34,
          width: width * 0.32,
          height: 17,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: `${colour}b0`,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 14,
          left: 2,
          right: 2,
          bottom: 0,
          borderWidth: 2,
          borderColor: `${colour}9e`,
          borderRadius: radius,
          backgroundColor: `${colour}20`,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 5,
            top: 9,
            bottom: 9,
            width: 2,
            borderRadius: 2,
            backgroundColor: `${colour}65`,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            right: 4,
            height: '23%',
            borderBottomLeftRadius: radius - 4,
            borderBottomRightRadius: radius - 4,
            backgroundColor: `${colour}78`,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: '27%',
            left: 4,
            right: 4,
            height: '20%',
            backgroundColor: `${colour}55`,
          }}
        />
      </View>
    </View>
  );
}

/** Static, clipped bottle silhouettes add a little game-world detail to the home menu. */
export function HomeArtifacts({ colours }: { colours: string[] }) {
  const bottles: {
    shape: BottleShape;
    colour: string;
    rotate: string;
    left?: number | `${number}%`;
    right?: number | `${number}%`;
    top: `${number}%`;
  }[] = [
    { shape: 'slim', colour: colours[0], rotate: '-14deg', left: -20, top: '11%' },
    { shape: 'round', colour: colours[1], rotate: '13deg', right: -33, top: '20%' },
    { shape: 'classic', colour: colours[2], rotate: '10deg', left: -31, top: '36%' },
    { shape: 'slim', colour: colours[3], rotate: '-12deg', right: -22, top: '44%' },
    { shape: 'round', colour: colours[2], rotate: '-11deg', left: -35, top: '59%' },
    { shape: 'classic', colour: colours[0], rotate: '14deg', right: -29, top: '66%' },
    { shape: 'slim', colour: colours[1], rotate: '9deg', left: -16, top: '81%' },
    { shape: 'round', colour: colours[3], rotate: '-13deg', right: -35, top: '84%' },
  ];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden' }}
    >
      {bottles.map((bottle, index) => (
        <View
          key={index}
          style={{ position: 'absolute', left: bottle.left, right: bottle.right, top: bottle.top }}
        >
          <GlassBottle colour={bottle.colour} shape={bottle.shape} rotate={bottle.rotate} />
        </View>
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
        <View
          key={`bubble-${dot}`}
          style={{
            position: 'absolute',
            left: `${(dot * 29 + 7) % 94}%`,
            top: `${(dot * 17 + 11) % 88}%`,
            width: dot % 2 ? 7 : 4,
            height: dot % 2 ? 7 : 4,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${colours[dot % colours.length]}7a`,
          }}
        />
      ))}
      {[0, 1, 2, 3, 4, 5].map((drop) => (
        <View
          key={`drop-${drop}`}
          style={{
            position: 'absolute',
            left: `${(drop * 37 + 15) % 90}%`,
            top: `${(drop * 23 + 18) % 84}%`,
            width: drop % 2 ? 8 : 6,
            height: drop % 2 ? 12 : 9,
            borderRadius: 9,
            borderTopLeftRadius: 1,
            borderWidth: 1,
            borderColor: `${colours[(drop + 1) % colours.length]}8c`,
            backgroundColor: `${colours[(drop + 1) % colours.length]}33`,
            transform: [{ rotate: `${drop % 2 ? 35 : -35}deg` }],
          }}
        />
      ))}
      {[0, 1, 2, 3].map((sparkle) => (
        <Text
          key={`sparkle-${sparkle}`}
          style={{
            position: 'absolute',
            left: `${(sparkle * 27 + 17) % 88}%`,
            top: `${(sparkle * 31 + 9) % 84}%`,
            color: colours[(sparkle + 2) % colours.length],
            fontSize: sparkle % 2 ? 17 : 13,
            opacity: 0.52,
          }}
        >
          ✦
        </Text>
      ))}
      <View
        style={{
          position: 'absolute',
          left: '50%',
          top: '84%',
          width: 168,
          height: 76,
          marginLeft: -84,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 18,
            right: 18,
            height: 12,
            borderRadius: 20,
            backgroundColor: `${colours[0]}2c`,
          }}
        />
        {(['slim', 'classic', 'round'] as const).map((shape, index) => (
          <View
            key={`bottom-bottle-${shape}`}
            style={{
              width: 46,
              height: 62,
              alignItems: 'center',
              justifyContent: 'flex-end',
              transform: [{ rotate: index === 0 ? '-9deg' : index === 2 ? '9deg' : '0deg' }],
            }}
          >
            <View style={{ transform: [{ scale: 0.54 }] }}>
              <GlassBottle colour={colours[index]} shape={shape} rotate="0deg" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
