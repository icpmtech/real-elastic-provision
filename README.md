# Elasticsearch e Kibana com Docker Compose

Este projeto configura um ambiente local com Elasticsearch e Kibana usando Docker Compose.

## Pré-requisitos

- Docker
- Docker Compose

## Como executar

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
