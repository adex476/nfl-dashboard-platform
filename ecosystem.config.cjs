module.exports = {
  apps: [
    {
      name: "nfl-dashboard",
      cwd: "./apps/dashboard",
      script: "npx",
      args: "vite preview --port 3000 --host",
      env_production: {
        NODE_ENV: "production",
        VITE_DATA_LAKE_URL: "http://localhost:8000",
        VITE_MODEL_API_URL: "http://localhost:8001",
      },
    },
  ],
};
