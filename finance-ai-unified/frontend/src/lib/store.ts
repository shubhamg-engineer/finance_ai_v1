import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PipelineResult } from "./api";

interface FinanceAIState {
  currentFileId: string | null;
  currentAnalysisId: string | null;
  
  // Quick Mode state (for home page non-persistent uploads)
  quickModeTxns: any[] | null;
  quickModeFilename: string | null;
  quickModeResult: PipelineResult | null;
  quickModeStage: "upload" | "preview" | "dashboard";
  
  // Actions
  setCurrentFileId: (id: string | null) => void;
  setCurrentAnalysisId: (id: string | null) => void;
  setQuickModeTxns: (txns: any[] | null) => void;
  setQuickModeFilename: (name: string | null) => void;
  setQuickModeResult: (result: PipelineResult | null) => void;
  setQuickModeStage: (stage: "upload" | "preview" | "dashboard") => void;
  resetQuickMode: () => void;
}

export const useFinanceStore = create<FinanceAIState>()(
  persist(
    (set) => ({
      currentFileId: null,
      currentAnalysisId: null,
      
      quickModeTxns: null,
      quickModeFilename: null,
      quickModeResult: null,
      quickModeStage: "upload",
      
      setCurrentFileId: (id) => set({ currentFileId: id }),
      setCurrentAnalysisId: (id) => set({ currentAnalysisId: id }),
      setQuickModeTxns: (txns) => set({ quickModeTxns: txns }),
      setQuickModeFilename: (name) => set({ quickModeFilename: name }),
      setQuickModeResult: (result) => set({ quickModeResult: result }),
      setQuickModeStage: (stage) => set({ quickModeStage: stage }),
      resetQuickMode: () =>
        set({
          quickModeTxns: null,
          quickModeFilename: null,
          quickModeResult: null,
          quickModeStage: "upload",
        }),
    }),
    {
      name: "finance-ai-storage",
      partialize: (state) => ({
        currentFileId: state.currentFileId,
        currentAnalysisId: state.currentAnalysisId,
        quickModeFilename: state.quickModeFilename,
        quickModeStage: state.quickModeStage,
        quickModeTxns: state.quickModeTxns,
        quickModeResult: state.quickModeResult,
      }),
    }
  )
);
