import { useState, useEffect } from "react";

interface HealthState {
  dataLakeOk: boolean | null;
  modelsOk: boolean | null;
}

async function ping(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export function useApiHealth(intervalMs = 15_000): HealthState {
  const [state, setState] = useState<HealthState>({
    dataLakeOk: null,
    modelsOk: null,
  });

  useEffect(() => {
    const dataLakeUrl = import.meta.env.VITE_DATA_LAKE_URL ?? "http://localhost:8000";
    const modelsUrl   = import.meta.env.VITE_MODEL_API_URL  ?? "http://localhost:8001";

    const check = async () => {
      const [dataLakeOk, modelsOk] = await Promise.all([
        ping(dataLakeUrl),
        ping(modelsUrl),
      ]);
      setState({ dataLakeOk, modelsOk });
    };

    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return state;
}
