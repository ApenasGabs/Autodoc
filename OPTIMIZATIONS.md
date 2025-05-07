# Otimizações para hardware limitado (16GB RAM, i5 7a geração)

## 1. Processamento em lotes

- Ajuste MAX_CONCURRENT_PROCESSES=2 para reduzir a carga na CPU
- Configure BATCH_SIZE=5 para menor uso de memória

## 2. LLM Local (se usar)

- Use modelos quantizados de 4-bit ou 8-bit para menor uso de memória
- Considere modelos menores como Llama 2 7B (4-bit) que podem rodar em 16GB RAM
- Ajuste NODE_OPTIONS="--max-old-space-size=8192" para limitar o uso de memória do Node.js

## 3. Exclusão de arquivos

- Exclua arquivos não essenciais como testes, fixtures, arquivos binários
- Configure MAX_FILE_SIZE_KB=250 para ignorar arquivos muito grandes

## 4. Docker

- Defina limites de recursos no Docker (--memory=12g --cpus=2)
- Use uma imagem base leve (node:18-slim)

## 5. Opção de API

- Use o modo API (LLM_TYPE=api) para processar em servidores externos
- Considere o modo híbrido (LLM_TYPE=hybrid) para equilibrar performance e custo
