import { create } from 'zustand';

interface UserLikesStore {
  likedArtickles: Record<string, boolean>;
  setLiked: (artickleId: string, isLiked: boolean) => void;
  toggleLiked: (artickleId: string) => boolean;
  clearAll: () => void;
}

export const useUserLikesStore = create<UserLikesStore>((set, get) => ({
  likedArtickles: {},
  setLiked: (artickleId, isLiked) => {
    set((state) => ({
      likedArtickles: {
        ...state.likedArtickles,
        [artickleId]: isLiked,
      },
    }));
  },
  toggleLiked: (artickleId) => {
    const current = get().likedArtickles[artickleId] ?? false;
    const newState = !current;
    set((state) => ({
      likedArtickles: {
        ...state.likedArtickles,
        [artickleId]: newState,
      },
    }));
    return newState;
  },
  clearAll: () => {
    set({ likedArtickles: {} });
  },
}));