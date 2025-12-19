# Elastic Search Demo Project

This project demonstrates a full-stack search application using Elasticsearch, ASP.NET Core, and React.

## Architecture

The solution consists of four main services orchestrated by Docker Compose:

1.  **Elasticsearch (8.11.1)**: The search engine and database.
2.  **Kibana (8.11.1)**: Visualization dashboard for Elasticsearch.
3.  **ElasticApp (ASP.NET Core 9.0)**: Backend API that handles data ingestion and search queries.
4.  **Client (React + Vite)**: Frontend application providing a Google-like search interface.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Getting Started

1.  **Clone the repository** (if you haven't already).

2.  **Start the services**:
    Run the following command in the root directory to build and start all containers:
    ```bash
    docker-compose up -d --build
    ```

3.  **Access the applications**:
    -   **Frontend (React)**: [http://localhost:5173](http://localhost:5173)
    -   **Backend API (Swagger)**: [http://localhost:5000/swagger](http://localhost:5000/swagger) (Note: Swagger might not be enabled in Production mode, check `Program.cs`) or access endpoints directly.
    -   **Kibana**: [http://localhost:5601](http://localhost:5601)
    -   **Elasticsearch**: [http://localhost:9200](http://localhost:9200)

## Setup & Usage

### 1. Create the Index
Before searching, you need to create the index in Elasticsearch. You can do this via the API.

**PowerShell:**
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/create-index
```

**cURL:**
```bash
curl -X POST http://localhost:5000/create-index
```

### 2. Ingest Data
Add some sample products to the index.

**PowerShell:**
```powershell
$body = @{
    id = "1"
    name = "Gaming Laptop"
    description = "High performance gaming laptop with RTX 4080"
    price = 2500.00
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:5000/ingest -ContentType "application/json" -Body $body
```

**cURL:**
```bash
curl -X POST http://localhost:5000/ingest \
   -H "Content-Type: application/json" \
   -d '{"id": "1", "name": "Gaming Laptop", "description": "High performance gaming laptop", "price": 2500.00}'
```

### 3. Search
Open the frontend at [http://localhost:5173](http://localhost:5173).
-   Type in the search bar (e.g., "laptop").
-   You will see autocomplete suggestions.
-   Press Enter to see full results with fuzzy search capabilities (handles typos).

## Project Structure

-   `docker-compose.yml`: Defines the multi-container application.
-   `src/ElasticApp/`: ASP.NET Core Web API project.
    -   `Program.cs`: Contains API endpoints and Elasticsearch configuration.
    -   `Product.cs`: Data model.
-   `client/`: React frontend project.
    -   `src/App.tsx`: Main search component and logic.

## Features

-   **Full-text Search**: Searches across Name and Description fields.
-   **Fuzzy Search**: Handles typos (e.g., "laptp" finds "Laptop").
-   **Autocomplete**: Provides suggestions as you type.
-   **Dockerized**: Zero-config setup with Docker Compose.

1.  Inicie os serviços:
    ```bash
    docker-compose up -d
    ```

2.  Acesse o Kibana no navegador:
    [http://localhost:5601](http://localhost:5601)

3.  Acesse o Elasticsearch:
    [http://localhost:9200](http://localhost:9200)

## Configuração

- **Elasticsearch**: Configurado como `single-node` para desenvolvimento. Segurança (xpack) desabilitada para facilitar o acesso local.
- **Kibana**: Conectado automaticamente ao container do Elasticsearch.

## Parar os serviços

Para parar e remover os containers:
```bash
docker-compose down
```

Para parar e remover também os volumes (dados):
```bash
docker-compose down -v
```
