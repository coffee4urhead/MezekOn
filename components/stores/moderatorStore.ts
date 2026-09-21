import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist, StateStorage } from 'zustand/middleware';

export type ModerationRef = [fileId: string, docId: string];

interface ModeratorMainControlState {
  reportedComments: string[];
  repCommentsError: string | null;
  audioFilesForModerationIds: ModerationRef[];
  pdfArchivesForModerationIds: ModerationRef[];
  error: string | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  hasMore: boolean;
  page: number;
  isRefreshing: boolean;
  isHydrated: boolean;
}

interface ModeratorActions {
  setReportedComments: (reportedComments: string[]) => void;
  setAudioFilesForModerationIds: (refs: ModerationRef[]) => void;
  setPDFArchivesForModerationIds: (refs: ModerationRef[]) => void;
  setLoading: (isLoading: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
  setHydrated: (hydrated: boolean) => void;

  appendReportedComments: (ids: string[]) => void;
  prependReportedComments: (ids: string[]) => void;
  removeReportedComment: (id: string) => void;
  clearReportedComments: () => void;
  hasReportedComment: (id: string) => boolean;

  appendAudioFilesForModerationIds: (refs: ModerationRef[]) => void;
  prependAudioFilesForModerationIds: (refs: ModerationRef[]) => void;
  removeAudioFileForModerationId: (fileId: string) => void;
  clearAudioFilesForModerationIds: () => void;
  hasAudioFileForModerationId: (fileId: string) => boolean;

  appendPDFArchivesForModerationIds: (refs: ModerationRef[]) => void;
  prependPDFArchivesForModerationIds: (refs: ModerationRef[]) => void;
  removePDFArchiveForModerationId: (fileId: string) => void;
  clearPDFArchivesForModerationIds: () => void;
  hasPDFArchiveForModerationId: (fileId: string) => boolean;

  removeFromAllQueues: (fileId: string) => void;
  clearAllQueues: () => void;
  incrementPage: () => void;
  decrementPage: () => void;
  resetPagination: () => void;
  syncModerationQueues: (snapshot: {
    audioRefs: ModerationRef[];
    pdfRefs: ModerationRef[];
  }) => void;
  clearError: () => void;
}

type ModeratorStore = ModeratorMainControlState & ModeratorActions;

const initialState: ModeratorMainControlState = {
  reportedComments: [],
  repCommentsError: null,
  audioFilesForModerationIds: [],
  pdfArchivesForModerationIds: [],
  error: null,
  isLoading: false,
  lastUpdated: null,
  hasMore: false,
  page: 1,
  isRefreshing: false,
  isHydrated: false,
};

const storage = createMMKV({
  id: 'artickle-storage',
});

const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    storage.remove(name);
  },
};

const PERSIST_KEY = 'moderator-storage';

const dedupeRefs = (refs: ModerationRef[]): ModerationRef[] => {
  const seen = new Set<string>();
  const result: ModerationRef[] = [];
  for (const ref of refs) {
    if (!seen.has(ref[0])) {
      seen.add(ref[0]);
      result.push(ref);
    }
  }
  return result;
};

const dedupeStrings = (ids: string[]): string[] => {
  return Array.from(new Set(ids));
};

export const useModeratorStorage = create<ModeratorStore>()(
  devtools(
    persist(
      (set, get) => {
        const actions: ModeratorActions = {
          setReportedComments: (reportedComments) => {
            set({
              reportedComments: dedupeStrings(reportedComments),
              lastUpdated: new Date(),
            });
          },

          setAudioFilesForModerationIds: (audioFilesForModerationIds) => {
            set({
              audioFilesForModerationIds: dedupeRefs(audioFilesForModerationIds),
              lastUpdated: new Date(),
            });
          },

          setPDFArchivesForModerationIds: (pdfArchivesForModerationIds) => {
            set({
              pdfArchivesForModerationIds: dedupeRefs(pdfArchivesForModerationIds),
              lastUpdated: new Date(),
            });
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

          setHydrated: (isHydrated) => {
            set({ isHydrated });
          },

          reset: () => {
            set({ ...initialState, isHydrated: true });
            storage.remove(PERSIST_KEY);
          },

          appendReportedComments: (ids) => {
            const current = get().reportedComments;
            set({
              reportedComments: dedupeStrings([...current, ...ids]),
              lastUpdated: new Date(),
            });
          },

          prependReportedComments: (ids) => {
            const current = get().reportedComments;
            set({
              reportedComments: dedupeStrings([...ids, ...current]),
              lastUpdated: new Date(),
            });
          },

          removeReportedComment: (id) => {
            set({
              reportedComments: get().reportedComments.filter((c) => c !== id),
              lastUpdated: new Date(),
            });
          },

          clearReportedComments: () => {
            set({ reportedComments: [], lastUpdated: new Date() });
          },

          hasReportedComment: (id) => {
            return get().reportedComments.includes(id);
          },

          appendAudioFilesForModerationIds: (refs) => {
            const current = get().audioFilesForModerationIds;
            set({
              audioFilesForModerationIds: dedupeRefs([...current, ...refs]),
              lastUpdated: new Date(),
            });
          },

          prependAudioFilesForModerationIds: (refs) => {
            const current = get().audioFilesForModerationIds;
            set({
              audioFilesForModerationIds: dedupeRefs([...refs, ...current]),
              lastUpdated: new Date(),
            });
          },

          removeAudioFileForModerationId: (fileId) => {
            set({
              audioFilesForModerationIds: get().audioFilesForModerationIds.filter(
                (ref) => ref[0] !== fileId
              ),
              lastUpdated: new Date(),
            });
          },

          clearAudioFilesForModerationIds: () => {
            set({ audioFilesForModerationIds: [], lastUpdated: new Date() });
          },

          hasAudioFileForModerationId: (fileId) => {
            return get().audioFilesForModerationIds.some((ref) => ref[0] === fileId);
          },

          appendPDFArchivesForModerationIds: (refs) => {
            const current = get().pdfArchivesForModerationIds;
            set({
              pdfArchivesForModerationIds: dedupeRefs([...current, ...refs]),
              lastUpdated: new Date(),
            });
          },

          prependPDFArchivesForModerationIds: (refs) => {
            const current = get().pdfArchivesForModerationIds;
            set({
              pdfArchivesForModerationIds: dedupeRefs([...refs, ...current]),
              lastUpdated: new Date(),
            });
          },

          removePDFArchiveForModerationId: (fileId) => {
            set({
              pdfArchivesForModerationIds: get().pdfArchivesForModerationIds.filter(
                (ref) => ref[0] !== fileId
              ),
              lastUpdated: new Date(),
            });
          },

          clearPDFArchivesForModerationIds: () => {
            set({ pdfArchivesForModerationIds: [], lastUpdated: new Date() });
          },

          hasPDFArchiveForModerationId: (fileId) => {
            return get().pdfArchivesForModerationIds.some((ref) => ref[0] === fileId);
          },

          removeFromAllQueues: (fileId) => {
            const state = get();
            set({
              audioFilesForModerationIds: state.audioFilesForModerationIds.filter(
                (ref) => ref[0] !== fileId
              ),
              pdfArchivesForModerationIds: state.pdfArchivesForModerationIds.filter(
                (ref) => ref[0] !== fileId
              ),
              lastUpdated: new Date(),
            });
          },

          clearAllQueues: () => {
            set({
              reportedComments: [],
              audioFilesForModerationIds: [],
              pdfArchivesForModerationIds: [],
              lastUpdated: new Date(),
            });
          },

          incrementPage: () => {
            set({ page: get().page + 1 });
          },

          decrementPage: () => {
            set({ page: Math.max(1, get().page - 1) });
          },

          resetPagination: () => {
            set({ page: 1, hasMore: true });
          },

          clearError: () => {
            set({ error: null, repCommentsError: null });
          },

          syncModerationQueues: ({ audioRefs, pdfRefs }) => {
            set({
                audioFilesForModerationIds: dedupeRefs(audioRefs),
                pdfArchivesForModerationIds: dedupeRefs(pdfRefs),
                lastUpdated: new Date(),
            });
          },
        };

        return {
          ...initialState,
          ...actions,
        };
      },
      {
        name: PERSIST_KEY,
        storage: createJSONStorage(() => zustandStorage),

        partialize: (state) => ({
          reportedComments: state.reportedComments,
          audioFilesForModerationIds: state.audioFilesForModerationIds,
          pdfArchivesForModerationIds: state.pdfArchivesForModerationIds,
          lastUpdated: state.lastUpdated,
          page: state.page,
          hasMore: state.hasMore,
        }),

        version: 1,

        migrate: (persistedState, version) => {
          if (typeof persistedState !== 'object' || persistedState === null) {
            return {
              reportedComments: [],
              audioFilesForModerationIds: [],
              pdfArchivesForModerationIds: [],
              lastUpdated: null,
              page: 1,
              hasMore: true,
            };
          }

          if (version === 0) {
            return {
              ...(persistedState as object),
            };
          }

          return persistedState;
        },

        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHydrated(true);
            console.log('Moderator store rehydrated successfully');
          } else {
            console.log('Failed to rehydrate moderator store');
          }
        },

        skipHydration: false,
      }
    ),
    { name: 'ModeratorStore' }
  )
);

export const useModeratorCountReportedComments = () =>
  useModeratorStorage((state) => state.reportedComments.length);