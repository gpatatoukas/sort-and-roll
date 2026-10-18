import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { adsAdapter } from '../../services/ads/adapter';
import { useFeedback } from './feedback-provider';
import type { AdSnapshot } from '../../services/ads/types';
type Ads = AdSnapshot & {
  watch: (grant: (transaction: string) => Promise<void>) => Promise<boolean>;
  betweenLevels: () => Promise<void>;
  privacy: () => Promise<void>;
};
const Context = createContext<Ads | null>(null);
export function AdsProvider({ children }: PropsWithChildren) {
  const state = useSyncExternalStore(
    adsAdapter.subscribe,
    adsAdapter.getSnapshot,
    adsAdapter.getSnapshot,
  );
  const busy = useRef(false);
  const feedback = useFeedback();
  useEffect(() => {
    void adsAdapter.initialize();
  }, []);
  useEffect(() => {
    feedback.suspend(state.showing);
    return () => feedback.suspend(false);
  }, [state.showing, feedback]);
  const value: Ads = {
    ...state,
    async watch(grant) {
      if (busy.current) return false;
      busy.current = true;
      try {
        if (adsAdapter.getSnapshot().rewarded !== 'ready') {
          adsAdapter.reloadRewarded();
          // Loading never traps gameplay in a spinner; tap again once ready.
          return false;
        }
        let write: Promise<void> = Promise.resolve();
        const result = await adsAdapter.showRewarded((transaction) => {
          write = grant(transaction);
          void write.catch(() => {});
        });
        await write;
        return result.earned;
      } finally {
        busy.current = false;
      }
    },
    async betweenLevels() {
      if (busy.current) return;
      busy.current = true;
      try {
        await adsAdapter.showInterstitial();
      } finally {
        busy.current = false;
      }
    },
    async privacy() {
      if (!busy.current) await adsAdapter.showPrivacyOptions();
    },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAds() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing AdsProvider');
  return value;
}
