import { useState, useEffect } from "react";
import { dataLake, modelApi, nanoClawApi } from "@nfl/api-client";

interface ApiHealth {
  dataLakeOk: boolean | null;
  modelsOk: boolean | null;
  nanoClawOk: boolean | null;
  isDemoMode: boolean;
}

const POLL_INTERVAL = 15_000;

export function useApiHealth(): ApiHealth {
  const [dataLakeOk, setDataLakeOk]   = useState<boolean | null>(null);
  const [modelsOk, setModelsOk]       = useState<boolean | null>(null);
  const [nanoClawOk, setNanoClawOk]   = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      try {
        await dataLake.health();
        setDataLakeOk(true);
      } catch {
        setDataLakeOk(false);
      }
      try {
        await modelApi.health();
        setModelsOk(true);
      } catch {
        setModelsOk(false);
      }
      try {
        await nanoClawApi.health();
        setNanoClawOk(true);
      } catch {
        setNanoClawOk(false);
      }
    }

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Only show demo mode once checks have completed and all failed
  const checksComplete = dataLakeOk !== null && modelsOk !== null && nanoClawOk !== null;
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true" ||
    (checksComplete && !dataLakeOk && !modelsOk && !nanoClawOk);

  return { dataLakeOk, modelsOk, nanoClawOk, isDemoMode };
}
