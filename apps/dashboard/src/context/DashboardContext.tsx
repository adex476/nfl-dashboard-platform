import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { DashboardFilters } from "@nfl/types";

const VIEW_ROUTES: Record<string, string> = {
  players: "/players",
  teams: "/overview",
  compare: "/players",
  draft: "/models",
  projections: "/models",
  home: "/overview",
};

interface ComparisonState {
  playerIds: string[];
  metrics: string[];
}

interface DashboardContextValue {
  filters: DashboardFilters;
  highlights: string[];
  comparison: ComparisonState | null;
  dispatchAction: (action: string, payload: Record<string, unknown>) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [highlights, setHighlights] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonState | null>(null);

  const dispatchAction = useCallback(
    (action: string, payload: Record<string, unknown>) => {
      switch (action) {
        case "navigate_to": {
          const view = payload.view as string;
          const route = VIEW_ROUTES[view] ?? "/overview";
          navigate(route);
          break;
        }
        case "apply_filters": {
          setFilters((prev) => ({ ...prev, ...payload }));
          break;
        }
        case "highlight_players": {
          const ids = (payload.player_ids as string[]) ?? [];
          setHighlights(ids);
          break;
        }
        case "show_comparison": {
          setComparison({
            playerIds: (payload.player_ids as string[]) ?? [],
            metrics: (payload.metrics as string[]) ?? [],
          });
          break;
        }
        default:
          console.warn("Unknown ui_action:", action, payload);
      }
    },
    [navigate],
  );

  return (
    <DashboardContext.Provider value={{ filters, highlights, comparison, dispatchAction }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
