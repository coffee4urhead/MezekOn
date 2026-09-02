import { ArtickleData } from '@/hooks/use-user-artickles';
import { useUserFiles } from '@/hooks/use-user-files';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ArtickleState {
  artickles: ArtickleData[];
  currentArtickle: ArtickleData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasMore: boolean;
  page: number;
}

interface ArtickleActions {
  setArtickles: (artickles: ArtickleData[]) => void;
  setCurrentArtickle: (artickle: ArtickleData | null) => void;
  setLoading: (isLoading: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
  
  optimisticAddArtickle: (artickle: ArtickleData) => void;
  optimisticUpdateArtickle: (id: string, updates: Partial<ArtickleData>) => void;
  optimisticDeleteArtickle: (id: string) => void;
  optimisticIncrementViews: (id: string) => void;
  optimisticIncrementLikes: (id: string) => void;
  optimisticDecrementLikes: (id: string) => void;
  optimisticIncrementComments: (id: string) => void;
  
  rollbackArtickle: (id: string, previousState: ArtickleData) => void;
  
  batchUpdate: (updates: { id: string; data: Partial<ArtickleData> }[]) => void;
}

type ArtickleStore = ArtickleState & ArtickleActions;

const initialState: ArtickleState = {
  artickles: [],
  currentArtickle: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastUpdated: null,
  hasMore: true,
  page: 1,
};

export const useArtickleStore = create<ArtickleStore>()(
  devtools(
    (set, get) => {
      const actions: ArtickleActions = {
        setArtickles: (artickles) => {
          set({ artickles, lastUpdated: new Date() });
        },
        
        setCurrentArtickle: (currentArtickle) => {
          set({ currentArtickle });
        },
        
        setLoading: (isLoading) => {
          set({ isLoading });
        },
        
        setRefreshing: (isRefreshing) => {
          set({ isRefreshing });
        },
        
        setError: (error) => {
          set({ error });
        },
        
        setHasMore: (hasMore) => {
          set({ hasMore });
        },
        
        setPage: (page) => {
          set({ page });
        },
        
        reset: () => {
          set(initialState);
        },
        
        optimisticAddArtickle: (artickle) => {
          set((state) => ({
            artickles: [artickle, ...state.artickles],
            lastUpdated: new Date(),
          }));
        },
        
        optimisticUpdateArtickle: (id, updates) => {
          set((state) => ({
            artickles: state.artickles.map((a) => 
              a.$id === id ? { ...a, ...updates, $updatedAt: new Date().toISOString() } : a
            ),
            currentArtickle: state.currentArtickle?.$id === id 
              ? { ...state.currentArtickle, ...updates, $updatedAt: new Date().toISOString() } 
              : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        optimisticDeleteArtickle: (id) => {
          set((state) => ({
            artickles: state.artickles.filter((a) => a.$id !== id),
            currentArtickle: state.currentArtickle?.$id === id ? null : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        optimisticIncrementViews: (id) => {
          set((state) => ({
            artickles: state.artickles.map((a) => 
              a.$id === id ? { ...a, views_count: (a.views_count || 0) + 1 } : a
            ),
            currentArtickle: state.currentArtickle?.$id === id 
              ? { ...state.currentArtickle, views_count: (state.currentArtickle.views_count || 0) + 1 } 
              : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        optimisticIncrementLikes: (id) => {
          set((state) => ({
            artickles: state.artickles.map((a) => 
              a.$id === id ? { ...a, likes_count: (a.likes_count || 0) + 1 } : a
            ),
            currentArtickle: state.currentArtickle?.$id === id 
              ? { ...state.currentArtickle, likes_count: (state.currentArtickle.likes_count || 0) + 1 } 
              : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        optimisticDecrementLikes: (id) => {
          set((state) => ({
            artickles: state.artickles.map((a) => 
              a.$id === id ? { ...a, likes_count: Math.max(0, (a.likes_count || 0) - 1) } : a
            ),
            currentArtickle: state.currentArtickle?.$id === id 
              ? { ...state.currentArtickle, likes_count: Math.max(0, (state.currentArtickle.likes_count || 0) - 1) } 
              : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        optimisticIncrementComments: (id) => {
          set((state) => ({
            artickles: state.artickles.map((a) => 
              a.$id === id ? { ...a, comments_count: (a.comments_count || 0) + 1 } : a
            ),
            currentArtickle: state.currentArtickle?.$id === id 
              ? { ...state.currentArtickle, comments_count: (state.currentArtickle.comments_count || 0) + 1 } 
              : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        rollbackArtickle: (id, previousState) => {
          set((state) => ({
            artickles: state.artickles.map((a) => a.$id === id ? previousState : a),
            currentArtickle: state.currentArtickle?.$id === id ? previousState : state.currentArtickle,
            lastUpdated: new Date(),
          }));
        },
        
        batchUpdate: (updates) => {
          set((state) => ({
            artickles: state.artickles.map((a) => {
              const update = updates.find((u) => u.id === a.$id);
              return update ? { ...a, ...update.data } : a;
            }),
            lastUpdated: new Date(),
          }));
        },
      };
      
      return {
        ...initialState,
        ...actions,
      };
    },
    { name: 'ArtickleStore' }
  )
);

export const useArtickleById = (id: string) => {
  return useArtickleStore((state) => state.artickles.find((a) => a.$id === id));
};

export const useArticklesByAuthor = (authorId: string) => {
  return useArtickleStore((state) => state.artickles.filter((a) => a.author_id === authorId));
};

export const useApprovedArtickles = () => {
  return useArtickleStore((state) => state.artickles.filter((a) => a.is_approved));
};

export const usePendingArtickles = () => {
  return useArtickleStore((state) => state.artickles.filter((a) => !a.is_approved));
};

export const useTrendingArtickles = (limit: number = 10) => {
  return useArtickleStore((state) => {
    return [...state.artickles]
      .sort((a, b) => {
        const scoreA = (a.likes_count || 0) + (a.views_count || 0);
        const scoreB = (b.likes_count || 0) + (b.views_count || 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  });
};

export const useTotalViews = () => {
  return useArtickleStore((state) => {
    return state.artickles.reduce((sum, a) => sum + (a.views_count || 0), 0);
  });
};

export const useTotalLikes = () => {
  return useArtickleStore((state) => {
    return state.artickles.reduce((sum, a) => sum + (a.likes_count || 0), 0);
  });
};

export const useHasArtickles = () => {
  return useArtickleStore((state) => state.artickles.length > 0);
};

export const useIsEmpty = () => {
  return useArtickleStore((state) => state.artickles.length === 0 && !state.isLoading);
};

export const useArtickleCount = () => {
  return useArtickleStore((state) => state.artickles.length);
};

export const useArtickleWithMediaUrls = (artickle_id: string) => {
  const artickle = useArtickleStore((state) => state.artickles.find(a=> artickle_id === a.$id));

  const { getArtickleMediaFile } = useUserFiles('');

  if (!artickle) return null;

  return {
    ...artickle,
    media_urls: artickle.media_urls?.map(id => getArtickleMediaFile(id)) || []
  }
}

export const useBatchArtickleUpdates = () => {
  const batchUpdate = useArtickleStore((state) => state.batchUpdate);
  const setArtickles = useArtickleStore((state) => state.setArtickles);
  
  return {
    updateMultiple: batchUpdate,
    syncList: setArtickles,
  };
};