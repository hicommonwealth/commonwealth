import { createBoundedUseStore } from 'state/ui/utils';
import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

interface threadCounterStore {
  totalThreadsInCommunity: number;
  totalThreadsInCommunityForVoting: number;
  setTotalThreadsInCommunity: (name: number) => void;
  setTotalThreadsInCommunityForVoting: (name: number) => void;
}

export const EXCEPTION_CASE_threadCountersStore =
  createStore<threadCounterStore>()(
    devtools((set) => ({
      totalThreadsInCommunity: 0,
      totalThreadsInCommunityForVoting: 0,
      setTotalThreadsInCommunity: (count) =>
        set({ totalThreadsInCommunity: count }),
      setTotalThreadsInCommunityForVoting: (count) =>
        set({ totalThreadsInCommunityForVoting: count }),
    }))
  );

// IMPORTANT: as the name suggests, this zustand store is an exception.
// --
// WHAT THIS STORE DOES? -- This store store's the counts of total thread in a chain and total thread that are in
// voting in a chain. These counters come from the /bulkOffChain api and it made sense to
// store those counts here. Ideally we should be store thread state or any other api response state in react query.
// Storing in zustand also makes the state 'reactive' (it will update without us having to trigger a force re-render)
// --
// THINGS NOT TO DO:
// -- We should not add new state variables here, unless there is a very very very important reason to do so --
// -- If we do add more state here, plz add a comment explaining it is added for the next person to be well aware --
// --
// -- THANKS :) --
const useEXCEPTION_CASE_threadCountersStore = createBoundedUseStore(
  EXCEPTION_CASE_threadCountersStore
);

export default useEXCEPTION_CASE_threadCountersStore;
