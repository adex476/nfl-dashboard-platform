import { Component, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import OverviewPage from "./pages/OverviewPage";
import PlayersPage from "./pages/PlayersPage";
import ModelsPage from "./pages/ModelsPage";
import NanoClawPage from "./pages/NanoClawPage";
import QueryPage from "./pages/QueryPage";
import { DashboardProvider } from "./context/DashboardContext";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "32px", fontFamily: "monospace", color: "#f87171" }}>
          <strong>Render error:</strong> {(this.state.error as Error).message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/nanoclaw" element={<NanoClawPage />} />
            <Route path="/query" element={<QueryPage />} />
          </Routes>
        </AppShell>
      </DashboardProvider>
    </ErrorBoundary>
  );
}
