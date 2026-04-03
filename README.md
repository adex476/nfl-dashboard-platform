# NFL Dashboard Platform

The NFL Dashboard Platform is a comprehensive, web-based interface designed to unlock the power of a sophisticated NFL analytics ecosystem. It provides scouts, analysts, and decision-makers with a unified hub to explore a rich data lake, run predictive machine learning models, and interact with a conversational AI agent.

This platform bridges the gap between raw data and actionable insights, presenting complex analytics in an intuitive and interactive format.

## System Architecture

This repository contains the frontend dashboard application. It serves as the user-facing layer for two powerful backend services, which are managed in separate repositories:

```
nfl-data-platform  (:8000)  ←── Centralized Data Lake (DuckDB + Neo4j)
nfl-model-platform (:8001)  ←── Predictive Models & AI Agent (Scikit-learn + FastAPI)
nfl-dashboard      (:3000)  ←── This repo. The React UI that connects to both.
```

The dashboard's role is to query these APIs and present the results in a compelling user interface. It does not perform any data processing or model execution itself.

## Features

The dashboard is organized into several powerful, purpose-built pages:

### 1. Overview: The Mission Control Center

A high-level view of the entire platform's health and status.

- **Live Service Monitoring**: Real-time status indicators for the Data Lake and Model Platform APIs ensure system transparency.
- **Model Registry**: See at a glance which of the 7+ machine learning models are online and ready for predictions.
- **Data Flow Visualization**: A static diagram provides a clear overview of the entire data pipeline, from raw ingestion to final presentation.

### 2. Players: The Digital Scouting Book

An interactive, filterable database of all players in the data lake.

- **Advanced Filtering**: Instantly filter thousands of players by position, draft year, college, and more.
- **Dynamic Search**: Quickly find specific players by name.
- **Sortable Stats**: Click any column header (e.g., 40-yard dash, bench press) to rank players and identify top performers.

### 3. Models: Predictive Analytics at Your Fingertips

Run complex machine learning models through a simple web form, no code required.

- **Prediction Runner**: Select a model (e.g., Player Performance Projection, Injury Risk Analysis), input player data, and receive instant predictions.
- **Explainable AI (XAI)**: Results are paired with SHAP bar charts that visualize _why_ the model made its prediction, showing the key features that influenced the outcome.

### 4. NanoClaw: Conversational AI for NFL Data

A chat interface powered by an AI agent that understands the platform's capabilities.

- **Natural Language Queries**: Ask complex questions in plain English, like "Find all cornerbacks from the SEC with a vertical jump over 40 inches."
- **AI-Powered Tool Use**: NanoClaw intelligently routes questions to the appropriate backend service, whether it's querying the data lake or running a predictive model.
- **Democratized Data Access**: Empowers non-technical users to perform complex data analysis without writing a single line of SQL.

### 5. SQL Query: The Analyst's Workbench

For power users, this page provides direct, read-only SQL access to the underlying DuckDB data warehouse.

- **Full SQL Editor**: Write and execute custom queries to explore the data in limitless ways.
- **Instant Results**: Query results are rendered immediately in a clean, scrollable table.
- **Example Queries**: Pre-loaded examples help users get started and understand the database schema.

## Repository Structure

```
nfl-dashboard/
├── apps/
│   └── dashboard/                        # The React app — runs on port 3000
├── packages/                             # Shared code — imported by apps
│   ├── types/                            # Shared TypeScript types
│   ├── api-client/                       # Typed API clients for backend services
│   └── ui/                               # Shared React components (Card, Badge, etc.)
├── turbo.json                            # Turborepo task pipeline
├── ecosystem.config.cjs                  # PM2 config for production
└── package.json                          # Workspace root + npm scripts
```

## Dev Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/adex476/nfl-dashboard-platform.git
    cd nfl-dashboard-platform
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**

    ```bash
    cp apps/dashboard/.env.example apps/dashboard/.env
    ```

    The default URLs in `.env` point to the local backend services.

4.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    The dashboard will start with hot reloading on port `3000`.

## Production Deployment

1.  **Build all packages and apps**

    ```bash
    npm run build
    ```

2.  **Start with PM2**
    PM2 is a process manager that keeps the application alive and enables clustering.
    ```bash
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    pm2 startup
    ```

## Tech Stack

| Tool                  | Purpose                                |
| --------------------- | -------------------------------------- |
| React 18              | UI component framework                 |
| TypeScript            | Type safety across the whole monorepo  |
| Vite 5                | Dev server + production bundler        |
| React Router 6        | Client-side page routing               |
| Recharts              | Charts and data visualization          |
| Turborepo             | Monorepo build orchestration + caching |
| PM2                   | Production process management          |
| IBM Plex + Bebas Neue | Typography                             |
