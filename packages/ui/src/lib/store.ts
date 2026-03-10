import { create } from 'zustand';
import type { Character, User, SyncStatus } from '@ae-ai/types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Characters
  characters: Character[];
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  removeCharacter: (id: string) => void;

  // Selected Character
  selectedCharacterId: string | null;
  setSelectedCharacterId: (id: string | null) => void;

  // Sync Status
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;

  // Loading States
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Characters
  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) =>
    set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
    })),

  // Selected Character
  selectedCharacterId: null,
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),

  // Sync Status
  syncStatus: 'synced',
  setSyncStatus: (status) => set({ syncStatus: status }),

  // Loading States
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
