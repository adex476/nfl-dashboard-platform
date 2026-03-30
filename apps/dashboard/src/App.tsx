import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import OverviewPage  from "./pages/OverviewPage";
import PlayersPage   from "./pages/PlayersPage";
import ModelsPage    from "./pages/ModelsPage";
import NullClawPage  from "./pages/NullClawPage";
import QueryPage     from "./pages/QueryPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/"          element={<Navigate to="/overview" replace />} />
        <Route path="/overview"  element={<OverviewPage />} />
        <Route path="/players"   element={<PlayersPage />} />
        <Route path="/models"    element={<ModelsPage />} />
        <Route path="/nullclaw"  element={<NullClawPage />} />
        <Route path="/query"     element={<QueryPage />} />
      </Routes>
    </AppShell>
  );
}
