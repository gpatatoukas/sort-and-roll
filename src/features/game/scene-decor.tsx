import { View, Text } from 'react-native';
import type { Background, Scene } from '../../config/backgrounds';
import { useAppearance } from './appearance';
function Motif({
  kind,
  size,
  ink,
  detail,
}: {
  kind: Scene;
  size: number;
  ink: string;
  detail: string;
}) {
  const u = size / 100;
  const circle = (x: number, y: number, w: number, h: number, colour: string, key: string) => (
    <View
      key={key}
      style={{
        position: 'absolute',
        left: x * u,
        top: y * u,
        width: w * u,
        height: h * u,
        borderRadius: 100 * u,
        backgroundColor: colour,
      }}
    />
  );
  const pine = kind === 'christmas';
  return (
    <View style={{ width: size, height: size }}>
      {pine ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: 45 * u,
              top: 40 * u,
              width: 10 * u,
              height: 55 * u,
              backgroundColor: detail,
              borderRadius: 2 * u,
            }}
          />
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (30 - i * 10) * u,
                top: (4 + i * 19) * u,
                width: 0,
                height: 0,
                borderLeftWidth: (20 + i * 10) * u,
                borderRightWidth: (20 + i * 10) * u,
                borderBottomWidth: (35 + i * 8) * u,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: ink,
              }}
            />
          ))}
          {kind === 'christmas' && (
            <>
              <Text
                style={{
                  position: 'absolute',
                  left: 39 * u,
                  top: -11 * u,
                  color: detail,
                  fontSize: 25 * u,
                }}
              >
                ✦
              </Text>
              {circle(28, 57, 7, 7, detail, 'a')}
              {circle(55, 39, 6, 6, '#db8d87', 'b')}
              {circle(60, 73, 8, 8, detail, 'c')}
            </>
          )}
        </>
      ) : kind === 'forest' ? (
        <>
          {[20, 53].map((x, i) => (
            <View key={x} style={{ position: 'absolute', left: x * u, top: (42 + i * 14) * u }}>
              <View
                style={{
                  left: 12 * u,
                  width: 10 * u,
                  height: 42 * u,
                  backgroundColor: detail,
                  borderRadius: 5 * u,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: -8 * u,
                  width: 36 * u,
                  height: 22 * u,
                  backgroundColor: ink,
                  borderTopLeftRadius: 28 * u,
                  borderTopRightRadius: 28 * u,
                }}
              />
            </View>
          ))}
          {circle(10, 16, 7, 7, detail, 'firefly1')}
          {circle(72, 28, 5, 5, detail, 'firefly2')}
          {circle(41, 8, 6, 6, detail, 'firefly3')}
        </>
      ) : kind === 'starfall' ? (
        <>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (8 + i * 22) * u,
                top: (15 + i * 23) * u,
                transform: [{ rotate: '-35deg' }],
              }}
            >
              <View
                style={{
                  width: (48 - i * 8) * u,
                  height: 3 * u,
                  borderRadius: 4 * u,
                  backgroundColor: ink,
                }}
              />
              <Text
                style={{
                  position: 'absolute',
                  right: -9 * u,
                  top: -14 * u,
                  fontSize: 25 * u,
                  color: detail,
                }}
              >
                ✦
              </Text>
            </View>
          ))}
        </>
      ) : kind === 'aurora' ? (
        <>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (3 + i * 37) * u,
                top: (46 - i * 19) * u,
                borderLeftWidth: 28 * u,
                borderRightWidth: 28 * u,
                borderBottomWidth: 48 * u,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: detail,
              }}
            />
          ))}
        </>
      ) : kind === 'halloween' ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: 45 * u,
              top: 12 * u,
              width: 11 * u,
              height: 24 * u,
              borderRadius: 4 * u,
              backgroundColor: '#95a47f',
              transform: [{ rotate: '16deg' }],
            }}
          />
          {circle(7, 30, 86, 61, ink, 'pumpkin')}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (19 + i * 17) * u,
                top: 31 * u,
                width: 28 * u,
                height: 59 * u,
                borderRadius: 30 * u,
                borderWidth: 1.5 * u,
                borderColor: '#a564465c',
              }}
            />
          ))}
          {[26, 61].map((x) => (
            <View
              key={x}
              style={{
                position: 'absolute',
                left: x * u,
                top: 47 * u,
                borderLeftWidth: 6 * u,
                borderRightWidth: 6 * u,
                borderBottomWidth: 9 * u,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#3a253a',
              }}
            />
          ))}
          <View
            style={{
              position: 'absolute',
              left: 33 * u,
              top: 64 * u,
              width: 33 * u,
              height: 13 * u,
              borderBottomWidth: 5 * u,
              borderBottomColor: '#3a253a',
              borderRadius: 20 * u,
            }}
          />
        </>
      ) : kind === 'lantern' ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: 49 * u,
              top: 0,
              width: u,
              height: 25 * u,
              backgroundColor: detail,
            }}
          />
          {circle(20, 22, 60, 57, ink, 'lantern')}
          {[30, 47, 64].map((x) => (
            <View
              key={x}
              style={{
                position: 'absolute',
                left: x * u,
                top: 26 * u,
                width: 5 * u,
                height: 48 * u,
                borderRadius: 20 * u,
                borderWidth: u,
                borderColor: detail,
              }}
            />
          ))}
          {[20, 75].map((y) => (
            <View
              key={y}
              style={{
                position: 'absolute',
                left: 31 * u,
                top: y * u,
                width: 38 * u,
                height: 5 * u,
                backgroundColor: detail,
                borderRadius: 2 * u,
              }}
            />
          ))}
          <View
            style={{
              position: 'absolute',
              left: 48 * u,
              top: 79 * u,
              width: 4 * u,
              height: 20 * u,
              backgroundColor: detail,
            }}
          />
        </>
      ) : kind === 'blossom' || kind === 'garden' || kind === 'lavender' ? (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 36 * u,
                top: 20 * u,
                width: 28 * u,
                height: 45 * u,
                borderRadius: 30 * u,
                backgroundColor: ink,
                transformOrigin: `${14 * u}px ${30 * u}px`,
                transform: [{ rotate: `${i * 72}deg` }],
              }}
            />
          ))}
          {circle(42, 42, 16, 16, detail, 'heart')}
        </>
      ) : kind === 'autumn' ? (
        <>
          <View
            style={{
              position: 'absolute',
              left: 20 * u,
              top: 15 * u,
              width: 60 * u,
              height: 65 * u,
              borderTopLeftRadius: 55 * u,
              borderBottomRightRadius: 55 * u,
              backgroundColor: ink,
              transform: [{ rotate: '20deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 49 * u,
              top: 30 * u,
              width: 2 * u,
              height: 60 * u,
              backgroundColor: detail,
              transform: [{ rotate: '35deg' }],
            }}
          />
        </>
      ) : kind === 'reef' || kind === 'lagoon' ? (
        <>
          {[18, 42, 66].map((x, i) => (
            <View
              key={x}
              style={{
                position: 'absolute',
                left: x * u,
                top: (40 - i * 9) * u,
                width: 14 * u,
                height: (55 + i * 8) * u,
                borderRadius: 10 * u,
                backgroundColor: i % 2 ? detail : ink,
                transform: [{ rotate: `${(i - 1) * 18}deg` }],
              }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: (28 + i * 23) * u,
                top: i * 10 * u,
                width: (9 - i) * u,
                height: (9 - i) * u,
                borderRadius: 10 * u,
                borderWidth: u,
                borderColor: detail,
              }}
            />
          ))}
        </>
      ) : kind === 'sunset' ? (
        <>
          {circle(14, 13, 72, 72, ink, 'sun')}
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: (67 + i * 10) * u,
                left: 4 * u,
                width: 92 * u,
                height: 4 * u,
                backgroundColor: detail,
                borderRadius: 5 * u,
              }}
            />
          ))}
        </>
      ) : kind === 'carnival' ? (
        <>
          <View
            style={{
              position: 'absolute',
              top: 43 * u,
              left: 49 * u,
              width: 2 * u,
              height: 53 * u,
              backgroundColor: detail,
            }}
          />
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: 25 * u,
                top: 13 * u,
                width: 28 * u,
                height: 36 * u,
                backgroundColor: i % 2 ? ink : detail,
                borderTopLeftRadius: 25 * u,
                borderBottomRightRadius: 25 * u,
                transformOrigin: `${25 * u}px ${36 * u}px`,
                transform: [{ rotate: `${i * 90}deg` }],
              }}
            />
          ))}
        </>
      ) : (
        <>
          {circle(23, 19, 55, 55, ink, 'planet')}
          <View
            style={{
              position: 'absolute',
              top: 33 * u,
              left: 2 * u,
              width: 96 * u,
              height: 28 * u,
              borderRadius: 60 * u,
              borderWidth: 2 * u,
              borderColor: detail,
              transform: [{ rotate: '-24deg' }],
            }}
          />
          <Text style={{ position: 'absolute', right: 0, top: 0, fontSize: 25 * u, color: detail }}>
            ✦
          </Text>
        </>
      )}
    </View>
  );
}
/** Static, code-authored decorations keep the bottle area quiet and cost no animation frames. */
export function SceneDecor({
  background,
  preview = false,
}: {
  background: Background;
  preview?: boolean;
}) {
  const appearance = useAppearance();
  const kind = background.id;
  const colours = appearance.dark ? background.dark : background.light;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      {!preview && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
          <View
            style={{
              position: 'absolute',
              width: 390,
              height: 390,
              borderRadius: 200,
              right: -190,
              top: -190,
              backgroundColor: `${colours[1]}26`,
              boxShadow: `0px 0px 95px ${background.detail}55`,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 430,
              height: 430,
              borderRadius: 220,
              left: -230,
              bottom: -250,
              backgroundColor: `${colours[0]}22`,
              boxShadow: `0px 0px 105px ${background.ink}55`,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 230,
              height: 230,
              borderRadius: 120,
              left: -125,
              top: '32%',
              backgroundColor: `${background.ink}14`,
            }}
          />
        </View>
      )}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: preview ? 0.85 : 0.28 }}
      >
      {kind !== 'studio' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: preview ? '7%' : '-5%',
              bottom: preview ? '5%' : '1%',
              transform: [{ rotate: '-10deg' }],
            }}
          >
            <Motif
              kind={kind}
              size={preview ? 52 : 135}
              ink={background.ink}
              detail={background.detail}
            />
          </View>
          <View
            style={{
              position: 'absolute',
              right: preview ? '3%' : '-4%',
              top: preview ? '-3%' : '13%',
              transform: [{ rotate: '12deg' }],
            }}
          >
            <Motif
              kind={kind}
              size={preview ? 36 : 90}
              ink={background.ink}
              detail={background.detail}
            />
          </View>
        </>
      )}
      {kind === 'aurora' &&
        [0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              right: '-30%',
              top: `${8 + i * 5}%`,
              width: '130%',
              height: preview ? 12 : 55,
              borderRadius: 100,
              backgroundColor: i % 2 ? background.detail : background.ink,
              opacity: 0.22,
              transform: [{ rotate: '-24deg' }],
            }}
          />
        ))}
      {Array.from({ length: preview ? 7 : 20 }, (_, i) => {
        const snow = kind === 'christmas' || kind === 'aurora';
        const leaf = kind === 'autumn' || kind === 'blossom';
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 23 + 7) % 100}%`,
              opacity: 0.3 + (i % 3) * 0.2,
            }}
          >
            <Text
              style={{
                color: snow ? '#eaf7ff' : background.detail,
                fontSize: preview ? 7 : leaf ? 15 : 11,
              }}
            >
              {snow ? '❄' : leaf ? '❧' : i % 3 ? '·' : '✧'}
            </Text>
          </View>
        );
      })}
      <View
        style={{
          position: 'absolute',
          bottom: preview ? -45 : -115,
          left: '-20%',
          width: '140%',
          height: preview ? 65 : 180,
          borderRadius: 1000,
          backgroundColor: background.ink,
          opacity: 0.1,
        }}
      />
      </View>
    </View>
  );
}
