import { useEffect, useState } from "react";
import { useVizStore } from "@/stores/vizStore";

export function useCodeInspectorState(focusedFilePath: string | null) {
  const { inspectorOpen } = useVizStore();

  // Code Inspector state
  const [codeInspectorState, setCodeInspectorState] = useState<'closed' | 'peek' | 'expanded'>('closed');
  // Store the user's preferred open mode (peek or expanded)
  const [preferredOpenState, setPreferredOpenState] = useState<'peek' | 'expanded'>('peek');

  // Auto-open in preferred mode when a file is selected or inspector is triggered
  useEffect(() => {
    // Only auto-open for actual file paths, not repo: or folder: identifiers
    const isFilePath = focusedFilePath && !focusedFilePath.startsWith('repo:');
    if (isFilePath) {
      if (inspectorOpen) {
        setCodeInspectorState('expanded');
        setPreferredOpenState('expanded');
      } else {
        setCodeInspectorState(preferredOpenState);
      }
    } else {
      setCodeInspectorState('closed');
      useVizStore.getState().setInspectorOpen(false);
    }
  }, [focusedFilePath, inspectorOpen, preferredOpenState]);

  return {
    codeInspectorState,
    setCodeInspectorState,
    setPreferredOpenState,
  };
}
