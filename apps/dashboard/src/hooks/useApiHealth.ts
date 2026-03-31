import { useState, useEffect } from "react";
import { dataLake, modelApi } from "@nfl/api-client";

export type HealthStatus = "online" | "offline" | "demo";

interface ApiHealth {
  dataLakeStatus: HealthStatus;
  modelsStatus: HealthStatus;
  dataLakeOk: boolean;
  modelsOk: boolean;
  isDemoMode: boolean;
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const POLL_INTERVAL = 15_000;

export function useApiHealth(): ApiHealth {
  const [dataLakeStatus, setDataLakeStatus] = useState<HealthStatus>(
    DEMO_MODE ? "demo" : "offline"
  );
  const [modelsStatus, setModelsStatus] = useState<HealthStatus>(
    DEMO_MODE ? "demo" : "offline"
  );

  useEffect(() => {
    if (DEMO_MODE) return;

    async function check() {
      try {
        await dataLake.health();
        setDataLakeStatus("online");
      } catch {
        setDataLakeStatus("offline");
      }
      try {
        await modelApi.health();
        setModelsStatus("online");
      } catch {
        setModelsStatus("offline");
      }
    }

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return {
    dataLakeStatus,
    modelsStatus,
    dataLakeOk: dataLakeStatus === "online" || dataLakeStatus === "demo",
    modelsOk: modelsStatus === "online" || modelsStatus === "demo",
    isDemoMode: DEMO_MODE,
  };
}