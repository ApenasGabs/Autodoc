#!/bin/bash

# Script para facilitar a execução do gerador de documentação

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens de erro e sair
error() {
  echo -e "${RED}ERRO: $1${NC}" >&2
  exit 1
}

# Função para imprimir mensagens de ajuda
help() {
  echo -e "${BLUE}Gerador de Documentação de Repositório${NC}"
  echo "Uso: ./start.sh [opções]"
  echo ""
  echo "Opções:"
  echo "  -h, --help            Mostra esta mensagem de ajuda"
  echo "  -o, --owner OWNER     Proprietário do repositório no GitHub"
  echo "  -r, --repo REPO       Nome do repositório no GitHub"
  echo "  -b, --branch BRANCH   Branch do repositório (padrão: main)"
  echo "  -t, --token TOKEN     Token de acesso do GitHub"
  echo "  -l, --local           Usar LLM local (padrão: api)"
  echo "  -k, --key KEY         Chave de API para LLM (necessário para api)"
  echo "  --html                Gerar saída em HTML (padrão: markdown)"
  echo ""
  echo "Exemplo:"
  echo "  ./start.sh -o microsoft -r vscode -b main -t ghp_123abc..."
  exit 0
}

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
  error "Docker não encontrado. Por favor, instale o Docker primeiro."
fi

# Verificar se o arquivo .env existe, caso contrário criar um modelo
if [ ! -f .env ]; then
  echo -e "${YELLOW}Arquivo .env não encontrado. Criando modelo...${NC}"
  cp .env.example .env 2>/dev/null || echo -e "# Arquivo de configuração\nGITHUB_TOKEN=\nLLM_TYPE=api\nLLM_API_KEY=\nOUTPUT_FORMAT=markdown" > .env
  echo -e "${GREEN}Arquivo .env criado. Edite-o com suas configurações ou use os parâmetros da linha de comando.${NC}"
fi

# Processar argumentos da linha de comando
OWNER=""
REPO=""
BRANCH="main"
TOKEN=""
LLM_TYPE="api"
API_KEY=""
OUTPUT_FORMAT="markdown"

while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      help
      ;;
    -o|--owner)
      OWNER="$2"
      shift 2
      ;;
    -r|--repo)
      REPO="$2"
      shift 2
      ;;
    -b|--branch)
      BRANCH="$2"
      shift 2
      ;;
    -t|--token)
      TOKEN="$2"
      shift 2
      ;;
    -l|--local)
      LLM_TYPE="local"
      shift
      ;;
    -k|--key)
      API_KEY="$2"
      shift 2
      ;;
    --html)
      OUTPUT_FORMAT="html"
      shift
      ;;
    *)
      error "Opção desconhecida: $1"
      ;;
  esac
done

# Atualizar o arquivo .env com os valores da linha de comando
if [ -n "$OWNER" ]; then
  sed -i.bak "s/^REPO_OWNER=.*/REPO_OWNER=$OWNER/" .env || echo "REPO_OWNER=$OWNER" >> .env
fi

if [ -n "$REPO" ]; then
  sed -i.bak "s/^REPO_NAME=.*/REPO_NAME=$REPO/" .env || echo "REPO_NAME=$REPO" >> .env
fi

if [ -n "$BRANCH" ]; then
  sed -i.bak "s/^REPO_BRANCH=.*/REPO_BRANCH=$BRANCH/" .env || echo "REPO_BRANCH=$BRANCH" >> .env
fi

if [ -n "$TOKEN" ]; then
  sed -i.bak "s/^GITHUB_TOKEN=.*/GITHUB_TOKEN=$TOKEN/" .env || echo "GITHUB_TOKEN=$TOKEN" >> .env
fi

if [ -n "$LLM_TYPE" ]; then
  sed -i.bak "s/^LLM_TYPE=.*/LLM_TYPE=$LLM_TYPE/" .env || echo "LLM_TYPE=$LLM_TYPE" >> .env
fi

if [ -n "$API_KEY" ]; then
  sed -i.bak "s/^LLM_API_KEY=.*/LLM_API_KEY=$API_KEY/" .env || echo "LLM_API_KEY=$API_KEY" >> .env
fi

if [ -n "$OUTPUT_FORMAT" ]; then
  sed -i.bak "s/^OUTPUT_FORMAT=.*/OUTPUT_FORMAT=$OUTPUT_FORMAT/" .env || echo "OUTPUT_FORMAT=$OUTPUT_FORMAT" >> .env
fi

# Remover arquivo de backup se existir
rm -f .env.bak 2>/dev/null

# Verificar requisitos mínimos
if ! grep -q "GITHUB_TOKEN=." .env || grep -q "GITHUB_TOKEN=$" .env; then
  error "Token do GitHub não configurado. Use -t/--token ou configure GITHUB_TOKEN no arquivo .env"
fi

if ! grep -q "REPO_OWNER=." .env || grep -q "REPO_OWNER=$" .env; then
  error "Proprietário do repositório não configurado. Use -o/--owner ou configure REPO_OWNER no arquivo .env"
fi

if ! grep -q "REPO_NAME=." .env || grep -q "REPO_NAME=$" .env; then
  error "Nome do repositório não configurado. Use -r/--repo ou configure REPO_NAME no arquivo .env"
fi

if grep -q "LLM_TYPE=api" .env && (! grep -q "LLM_API_KEY=." .env || grep -q "LLM_API_KEY=$" .env); then
  error "Chave de API não configurada para LLM. Use -k/--key ou configure LLM_API_KEY no arquivo .env"
fi

# Criar diretório de saída se não existir
mkdir -p output

echo -e "${BLUE}Configuração:${NC}"
echo -e "- Repositório: $(grep REPO_OWNER .env | cut -d= -f2)/$(grep REPO_NAME .env | cut -d= -f2)"
echo -e "- Branch: $(grep REPO_BRANCH .env | cut -d= -f2 || echo 'main')"
echo -e "- Tipo de LLM: $(grep LLM_TYPE .env | cut -d= -f2)"
echo -e "- Formato de saída: $(grep OUTPUT_FORMAT .env | cut -d= -f2)"

# Construir imagem Docker se necessário
echo -e "\n${YELLOW}Construindo/atualizando a imagem Docker...${NC}"
docker-compose build --no-cache || error "Falha ao construir a imagem Docker"

# Executar o contêiner
echo -e "\n${GREEN}Iniciando o gerador de documentação...${NC}"
docker-compose up || error "Falha ao executar o contêiner Docker"

echo -e "\n${GREEN}Processamento concluído!${NC}"
echo -e "Os arquivos de documentação estão disponíveis no diretório 'output/'"