#!/bin/bash

# Script para executar o gerador de documentação diretamente usando Docker

# Definir variáveis
GITHUB_TOKEN=${GITHUB_TOKEN:-""}
REPO_OWNER=${REPO_OWNER:-""}
REPO_NAME=${REPO_NAME:-""}
REPO_BRANCH=${REPO_BRANCH:-"main"}
LLM_TYPE=${LLM_TYPE:-"api"}
LLM_API_KEY=${LLM_API_KEY:-""}
OUTPUT_FORMAT=${OUTPUT_FORMAT:-"markdown"}
OUTPUT_DIR="$(pwd)/output"

# Verificar requisitos
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Erro: GITHUB_TOKEN não configurado"
  exit 1
fi

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo "Erro: REPO_OWNER ou REPO_NAME não configurado"
  exit 1
fi

if [ "$LLM_TYPE" == "api" ] && [ -z "$LLM_API_KEY" ]; then
  echo "Erro: LLM_API_KEY não configurado para uso com API"
  exit 1
fi

# Criar diretório de saída
mkdir -p "$OUTPUT_DIR"

# Executar o contêiner
docker run --rm -it \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  -e REPO_OWNER="$REPO_OWNER" \
  -e REPO_NAME="$REPO_NAME" \
  -e REPO_BRANCH="$REPO_BRANCH" \
  -e LLM_TYPE="$LLM_TYPE" \
  -e LLM_API_KEY="$LLM_API_KEY" \
  -e OUTPUT_FORMAT="$OUTPUT_FORMAT" \
  -v "$OUTPUT_DIR:/app/output" \
  --memory=12g \
  --cpus=2 \
  repo-doc-generator:latest