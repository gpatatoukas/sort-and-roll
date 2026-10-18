import { Image } from 'react-native';
import type { Power } from '../../engine/game';
const ART = {
  undo: require('../../../assets/power-ups/undo.png'),
  hint: require('../../../assets/power-ups/hint.png'),
  bottle: require('../../../assets/power-ups/bottle.png'),
  reveal: require('../../../assets/power-ups/reveal.png'),
  remove: require('../../../assets/power-ups/remove.png'),
};
/** Bundled illustrations also work in native builds without the SVG module. */
export function PowerIcon({ power, size = 54 }: { power: Power; size?: number }) {
  return (
    <Image
      source={ART[power]}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
