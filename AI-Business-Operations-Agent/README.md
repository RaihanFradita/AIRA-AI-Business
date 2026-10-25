# AI Business Operations Agent

> A local-first AI agent for analyzing business and sales data using **Ollama, Gemma 3, Python, and business-focused tools**.

**AI Business Operations Agent** is an experimental AI agent designed to help users interact with business data through natural language.

Instead of manually calculating sales metrics from CSV files, users can ask questions such as:

* "Produk mana yang paling banyak terjual?"
* "Berapa total revenue?"
* "Produk mana yang paling menguntungkan?"
* "Bagaimana profit margin bisnis ini?"

The agent interprets the user's request, selects the appropriate tool, processes the business data, and returns the result.

---

## ✨ Features

* 🧠 **AI Agent Architecture**

  * Uses an agent-based workflow to determine which tool should be executed.
* 🏠 **Local AI**

  * Runs locally using **Ollama**, reducing dependency on paid cloud APIs.
* 📊 **Business Data Analysis**

  * Reads and analyzes sales data from CSV files.
* 🧮 **Calculation Tools**

  * Performs business-related calculations.
* 💬 **Natural Language Interaction**

  * Users can interact with the system using normal questions.
* 🔐 **Local & Private**

  * Business data can remain on the local machine.
---

## 🏗️ Architecture

The current V1 architecture is intentionally simple:

```text
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│     Hermes Agent     │
│  Agent / Tool Logic  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│        Ollama        │
│     Local LLM        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Business        │
│       Tools          │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      Sales CSV       │
│       Dataset        │
└──────────────────────┘
```

### Agent Flow

```text
User Question
      ↓
Agent interprets intent
      ↓
Select appropriate tool
      ↓
Tool processes business data
      ↓
Result returned to agent
      ↓
Agent presents the answer
```

---

## 🛠️ Tech Stack

| Technology   | Purpose                         |
| ------------ | ------------------------------- |
| Python       | Main programming language       |
| Ollama       | Local LLM runtime               |
| Gemma 3 4B   | Local language model            |
| Hermes Agent | Agent and tool-calling workflow |
| Pandas       | CSV and data processing         |
| CSV          | Business data source            |
| Git & GitHub | Version control                 |

---

## 📁 Project Structure

```text
ai-business-agent/
│
├── agent.py
├── tools.py
├── main.py
├── config.py
├── requirements.txt
├── README.md
├── .gitignore
│
└── data/
    └── sales.csv
```

### File Description

**`main.py`**
Main entry point for running the AI Business Agent.

**`agent.py`**
Contains the agent configuration and interaction logic.

**`tools.py`**
Contains business-related tools used by the agent, such as sales analysis and calculations.

**`config.py`**
Contains project configuration such as model and provider settings.

**`data/sales.csv`**
Business sales dataset used for analysis.

**`requirements.txt`**
Python dependencies required by the project.

---

## ⚙️ Requirements

Before running the project, make sure you have:

* Python 3.10+
* Git
* Ollama
* A local LLM compatible with the project

For the current setup, the project uses:

```text
gemma3:4b
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/RaihanFradita/AI-Business-Operations-Agent.git
cd AI-Business-Operations-Agent
```

### 2. Create a Virtual Environment

Windows:

```powershell
python -m venv venv
```

Activate it:

```powershell
venv\Scripts\activate
```

Linux / macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Install Ollama

Install Ollama on your machine and make sure the Ollama service is running.

Pull the model:

```bash
ollama pull gemma3:4b
```

Verify the model:

```bash
ollama list
```

You should see:

```text
gemma3:4b
```

---

## ▶️ Running the Agent

Start the application with:

```bash
python main.py
```

Example:

```text
============================================
AI BUSINESS AGENT V1
============================================
Model    : gemma3:4b
Provider : Ollama
Mode     : Local
============================================

Ketik 'exit' atau Ctrl+C untuk keluar.

User > produk mana yang lebih banyak terjual?

[Agent] Selecting tool: sales_analysis
[Tool] sales_analysis executed
[Tool] Result received

Agent >

Total Revenue : Rp7.835.113
Total Cost    : Rp7.120.401
Total Profit  : Rp714.712
Profit Margin : 9.12%

Produk Terlaris     : Staples (876 unit)
Produk Paling Untung: Fellowes Lockers, Wire Frame (Rp4.341)
```

---

## 📊 Example Use Cases

### Sales Performance

```text
User > Produk mana yang paling banyak terjual?
```

The agent analyzes the sales dataset and identifies the product with the highest number of units sold.

### Revenue Analysis

```text
User > Berapa total revenue?
```

The business analysis tool calculates the total revenue from the dataset.

### Profit Analysis

```text
User > Produk mana yang paling menguntungkan?
```

The agent identifies the product generating the highest profit.

### Business Overview

```text
User > Berikan analisis bisnis secara keseluruhan.
```

The agent can return metrics such as:

```text
Total Revenue
Total Cost
Total Profit
Profit Margin
Best Selling Product
Most Profitable Product
```

---

## 🧪 Current Version

### V1 — Local Business Agent

The first version focuses on understanding the fundamental architecture of an AI agent.

Current components:

* Local LLM
* Agent
* Tool calling
* CSV business data
* Sales analysis
* Basic calculations
* CLI interface

The goal of V1 is **not** to build a large production system.

The goal is to understand how an AI agent can:

```text
Understand → Decide → Use Tool → Process Data → Respond
```

---

## 🚧 Limitations

This is currently an early-stage project.

The current version does not yet include:

* ❌ RAG
* ❌ Long-term memory
* ❌ Multi-agent system
* ❌ Web search
* ❌ WhatsApp integration
* ❌ Google Sheets integration
* ❌ Database integration
* ❌ Web dashboard
* ❌ Authentication
* ❌ Cloud deployment
* ❌ Production monitoring

These features may be considered in future versions.

---

## 🗺️ Roadmap

### V1 — Foundation

* [x] Local LLM
* [x] Ollama integration
* [x] Agent workflow
* [x] Business tools
* [x] CSV dataset
* [x] Sales analysis
* [x] CLI interface

### V2 — Improved Business Intelligence

* [ ] Better intent detection
* [ ] More specialized business tools
* [ ] Product performance analysis
* [ ] Customer analysis
* [ ] Time-based sales analysis
* [ ] Improved response formatting

### V3 — Advanced Agent

* [ ] RAG
* [ ] Vector database
* [ ] Business document analysis
* [ ] Agent memory
* [ ] More complex tool orchestration

### V4 — Business Platform

* [ ] Web dashboard
* [ ] Database integration
* [ ] Authentication
* [ ] API backend
* [ ] Business reporting
* [ ] Deployment

---

## 🎯 Project Goals

This project is being developed as a learning and portfolio project focused on:

* Understanding AI Agent architecture
* Learning tool calling
* Understanding LLM + external tools integration
* Building local-first AI applications
* Applying AI to business operations
* Improving Python and AI engineering skills

The project emphasizes **understanding the underlying system rather than simply relying on AI-generated code**.

---

## 🔒 Privacy

The project is designed around a local-first approach.

Business data can be processed locally through:

```text
Python
   +
Ollama
   +
Local LLM
```

This makes the architecture suitable for experimentation with private or sensitive business datasets without requiring every request to be sent to a cloud AI provider.

---

## 📚 Learning Focus

Through this project, the following concepts are explored:

```text
Large Language Models
        ↓
AI Agents
        ↓
Tool Calling
        ↓
Data Processing
        ↓
Business Intelligence
        ↓
AI-Powered Automation
```

This project is part of my ongoing journey toward becoming an **AI Engineer**.

---

## 👨‍💻 Author

**Raihan Fradita**

Informatics / IT Student
AI Engineer Enthusiast

GitHub: [RaihanFradita](https://github.com/RaihanFradita)

---

## ⭐ Future Vision

The long-term vision is to evolve this project from a simple local CLI agent into an AI-powered business operations assistant capable of helping businesses analyze data, generate insights, and automate repetitive operational tasks.

> **From a simple AI agent → to an intelligent business operations system.**
