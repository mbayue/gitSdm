import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MotionPreference = 'system' | 'reduced' | 'full';
export const useMotionStore = create(
  persist<{
    preference: MotionPreference;
    setPreference: (preference: MotionPreference) => void;
  }>(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    { name: 'gitsdm-motion', partialize: (state) => state },
  ),
);
