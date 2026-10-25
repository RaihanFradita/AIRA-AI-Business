# AIRA Business — Local AI Financial Intelligence

**AI-powered financial analytics for businesses, running on your own PC or laptop.**

AIRA Business is a financial intelligence web application designed to help SMEs and enterprises understand their business performance through financial dashboards, interactive analytics, AI-assisted conversations, and Excel/CSV data imports.

The application runs locally on your computer. When configured with **Ollama and Gemma 3 4B**, its language model can also run locally without requiring a paid external AI API.

> **Project status:** In development. Features and integrations may change as development continues.

## Overview

AIRA Business combines financial analytics with a conversational AI interface to make business data easier to understand.

- Financial dashboards for revenue, profit, expenses, and margins.
- AI Assistant for questions about financial performance.
- Excel and CSV imports for analyzing business data.
- Product profitability, trend analysis, forecasting, and anomaly indicators.
- Local deployment for individuals, developers, and businesses that prefer to keep their data on their own machine.

## Screenshots

<img width="810" height="742" alt="AIRA Business AI Assistant" src="https://github.com/user-attachments/assets/2c1e6933-e8ff-47ac-b59e-94f81835343c" />

<img width="1580" height="907" alt="AIRA Business Financial Analytics" src="https://github.com/user-attachments/assets/b804b329-9412-4a62-bb51-cb4aec8c9ea7" />

<img width="1435" height="798" alt="AIRA Business Financial Reports" src="https://github.com/user-attachments/assets/8fbcb066-7ad1-4246-9a16-11385ae2702b" />

## Key Features

| Module | Description |
|---|---|
| **Command Center** `/app` | Revenue, gross profit, margin, operating profit, transaction count, average order value, charts, product rankings, anomaly indicators, forecasts, and AI insights. |
| **AI Assistant** `/assistant` | Ask financial questions in Indonesian or English (US). Supports conversational responses and charts or tables where available. Open the global chat drawer with `Ctrl/⌘ + J`. |
| **Data Studio** `/data` | Import `.xlsx` and `.csv` files, detect common Indonesian and English column names, map columns manually, and preview datasets. |
| **Deep Analytics** `/analysis` | Pareto analysis, product revenue-versus-margin matrix, product profitability, monthly growth, and forecasting. |
| **Income Statement** `/income-statement` | Monthly financial reports, profit bridge, and CSV export. |
| **Business Operations** | Transactions, inventory, products, customers, and reports. Product records support cost of goods sold (COGS). |
| **Demo** `/demo` | Explore selected finance features using sample data without logging in or connecting a database. LLM chat requires its backend configuration. |
| **Company Settings** | Manage company profile details and choose Indonesian or English (US) interface language. |

Feature availability depends on the current implementation and configuration.

## Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, Recharts
- **Backend:** Bun, Elysia
- **Database:** PostgreSQL
- **Local AI runtime:** Ollama (optional)
- **Language model:** Gemma 3 4B (optional)
- **Data input:** Excel (`.xlsx`) and CSV

## Local-First Architecture

AIRA Business is designed to run on a personal computer or laptop rather than requiring a hosted application server.

```text
Your PC / Laptop
│
├── AIRA Business Frontend
│   └── React + Vite
│
├── AIRA Business Backend
│   └── Bun + Elysia API
│
├── PostgreSQL
│   └── Application and business data
│
└── Optional Local AI
    └── Ollama + Gemma 3 4B
```

The frontend, backend, database, and local AI runtime can run on the same computer. This is suitable for development, personal use, and controlled local deployments.

**Important:** Running locally does not automatically guarantee complete privacy. External AI providers, remote database configurations, telemetry, or other integrations can still transmit data if enabled. Review your configuration before using confidential business information.

## Hardware Requirements

Hardware requirements depend on whether you only want to use the financial dashboard or also run the language model locally.

### 1. Dashboard and business application

| Component | Minimum practical specification | Recommended |
|---|---|---|
| CPU | 4-core Intel Core i5 or AMD Ryzen 5 class | Modern 6-core CPU or better |
| RAM | 8 GB | 16 GB or more |
| Storage | 10 GB free space for the application and dependencies | SSD with 20–30 GB or more available |
| GPU | Integrated graphics | Dedicated GPU optional |
| OS | Windows, Linux, or macOS with compatible runtimes | 64-bit OS with current supported runtimes |

These are practical planning estimates, not formally benchmarked minimum specifications. PostgreSQL, browser usage, dataset size, and development tools affect actual resource consumption.

### 2. Running Gemma 3 4B locally with Ollama

| Component | Recommended specification |
|---|---|
| CPU | Modern 6-core CPU or better |
| RAM | 16 GB or more |
| GPU | NVIDIA GPU with 6 GB VRAM or more is a useful target |
| Storage | Allow several GB for the model; Gemma 3 4B's commonly distributed quantized model is approximately 3–4 GB, with additional space needed for runtime files and caches |
| Runtime | Ollama installed and running locally |

A compatible GPU can improve inference speed, but a dedicated GPU is not mandatory. CPU-only inference may work, although responses can be slower. Actual memory and VRAM usage depend on quantization, context length, runtime settings, and concurrent applications.

### 3. Example: Developer laptop configuration

The following is an example of hardware suitable for development and experimentation with AIRA Business and a small local model.

| Component | Example configuration |
|---|---|
| Laptop | Lenovo Legion Y540 |
| CPU | Intel Core i7-9750H, 6 cores / 12 threads |
| RAM | 16 GB |
| GPU | NVIDIA GeForce GTX 1660 Ti, typically 6 GB VRAM |
| Storage | Two 256 GB SSDs, 512 GB total capacity |

This configuration is a reasonable starting point for the dashboard, PostgreSQL, and Gemma 3 4B through Ollama. With 16 GB RAM, avoid running too many memory-intensive applications simultaneously. Larger models or longer context windows may require more resources.

These specifications are an example, not a requirement for every AIRA Business installation.

## Getting Started

### Prerequisites

Install the following tools before starting:

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/)
- [Node.js and npm](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Ollama](https://ollama.com/) — optional, required for the local LLM configuration

### 1. Configure the environment

From the project root, create a local environment file using the supplied example:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Configure the required database connection and a long, random `JWT_SECRET`. Use the variable names expected by the project's current backend configuration.

**Never commit `.env`, passwords, API keys, or production credentials to GitHub.**

### 2. Create the database

Create a PostgreSQL database named `aira_business`, then run the existing database setup scripts.

```bash
createdb aira_business
```

From the backend directory:

```bash
bun install
bun run db:setup
```

If your environment does not provide `createdb`, create the database using `psql` or your PostgreSQL administration tool.

For a development database, the repository's seed script can be used:

```bash
psql "$DATABASE_URL" -f ../database/seed.sql
```

The seed script may insert demo users and sample financial records. Review its contents before running it, and never use demo credentials in production.

### 3. Start the backend

```bash
cd backend
bun run dev
```

Check the API health endpoint:

```text
http://localhost:3000/api/health
```

### 4. Start the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local development URL printed by Vite, commonly:

```text
http://localhost:5173
```

You can also explore the demo route at `/demo`.

> Run commands from the appropriate directories and check the existing package scripts if your local project uses different script names.

## Configure Local AI

AIRA Business includes a deterministic financial analysis path and supports optional LLM-generated explanations. The LLM is not a replacement for the application's financial calculations.

### Option A — Local analysis without an external AI API

Use the available local analysis functionality to interpret supported questions and calculate financial results from the provided dataset.

This mode does not require a paid LLM API key, but its capabilities depend on the available local analysis implementation.

### Option B — Ollama + Gemma 3 4B

Install Ollama and download the model:

```bash
ollama pull gemma3:4b
```

Start Ollama and configure the backend's `.env` using the variable names supported by the current implementation. Common settings are:

```dotenv
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

Restart the backend after changing the configuration.

When Ollama is running locally, requests can be processed by the local model without sending prompts to an external LLM provider. Verify the active provider and application logs before entering confidential information.

### Option C — External LLM provider

An external provider can be configured if supported by your current backend.

For example:

```dotenv
ANTHROPIC_API_KEY=your_api_key
```

Follow the provider's current configuration and billing requirements. Requests sent to an external provider may leave your computer, so review the data-sharing implications first.

### AI and financial accuracy

- Financial calculations should come from the application's calculation logic and available dataset, not invented LLM-generated numbers.
- AI-generated explanations may be incomplete or incorrect and should be checked against source data.
- Unsupported questions should be handled without fabricating financial facts.
- Excel cell contents must be treated as untrusted input.
- If an AI provider is unavailable, fallback behavior depends on the active implementation.

## Data Import

The Data Studio accepts `.xlsx` and `.csv` files.

Suggested columns:

```text
Tanggal, Produk, Kategori, Pelanggan, Channel,
Qty, Pendapatan, HPP, Beban Operasional
```

Required fields generally include a date and revenue, or sufficient price and quantity data to derive revenue. HPP enables product cost and margin analysis, while operating expenses enable operating-profit analysis.

The import flow supports common Indonesian and English headers, Indonesian currency formats such as `Rp 1.250.000`, date formats such as `dd/mm/yyyy`, and manual column mapping.

Older `.xls` files should be saved as `.xlsx` or `.csv` before importing.

### Local data handling

- Imported spreadsheet files are processed in the browser according to the current implementation.
- The most recent dataset may be stored in browser `localStorage` when it is below the application's configured storage threshold, currently documented as 4 MB.
- Browser storage is local to that browser profile and is not equivalent to encrypted or backed-up storage.
- Clear browser storage only after exporting any data you need to keep.

## API Overview

The project includes existing application endpoints and additional finance and AI endpoints, including:

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Backend health check |
| `GET /api/finance/transactions?days=` | Retrieve finance transactions, subject to authorization |
| `GET /api/company-profile/` | Retrieve the authenticated user's company profile |
| `PUT /api/company-profile/` | Update the company profile, subject to authorization |
| `GET /api/ai/status` | Check AI configuration or status |
| `POST /api/ai/chat` | Submit a chat request |

Authentication, authorization, and request requirements depend on the current backend implementation. Refer to the source code for exact request and response schemas.

## Analytics Notes

- Forecasts use linear regression with an approximate 80% range; they are directional estimates, not guaranteed outcomes.
- Anomaly indicators use a robust z-score approach.
- Financial insights depend on the completeness and accuracy of the imported or stored data.
- AI summaries should not be treated as audited financial statements or professional investment advice.

## Security and Privacy

For a local installation:

1. Keep database credentials, JWT secrets, and API keys in `.env`.
2. Do not expose the backend or PostgreSQL port publicly unless you have secured the deployment.
3. Avoid using demo credentials for real data.
4. Back up the database before running migrations or database setup scripts.
5. Use local Ollama configuration when you need LLM inference to stay on your computer.
6. Verify whether any external services, remote databases, or integrations are enabled before processing confidential company data.

Local execution reduces reliance on hosted application infrastructure, but security still depends on your computer, account permissions, network configuration, and software updates.

## Current Limitations

- AIRA Business is under active development.
- Available dashboards and analytics depend on the dataset and current implementation.
- Local LLM inference can be slower than hosted inference, especially without a compatible GPU.
- Forecasts and anomaly detection provide analytical indicators rather than guaranteed predictions.
- The experimental `AI-Business-Operations-Agent/` Python/Ollama component is maintained separately from the primary application unless explicitly integrated.

## License

Add your chosen open-source license here before distributing the project publicly. Until a license is specified, do not assume that others have permission to reuse or redistribute the code.

---

**AIRA Business — Understand your business data. Run AI on your own machine.**
