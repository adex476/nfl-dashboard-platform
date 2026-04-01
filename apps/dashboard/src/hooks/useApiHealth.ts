import { useState, useEffect } from "react";
import { dataLake, modelApi } from "@nfl/api-client";

interface ApiHealth {
  dataLakeOk: boolean;
  modelsOk: boolean;
}

const POLL_INTERVAL = 15_000;

export function useApiHealth(): ApiHealth {
  const [dataLakeOk, setDataLakeOk] = useState(false);
  const [modelsOk, setModelsOk]     = useState(false);

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
    }

    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return { dataLakeOk, modelsOk };
}