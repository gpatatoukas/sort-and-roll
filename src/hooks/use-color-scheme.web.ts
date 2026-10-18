import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
const subscribe = () => () => undefined;
export function useColorScheme() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const colour = useRNColorScheme();
  return hydrated ? colour : 'light';
}
