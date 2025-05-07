# AutoDoc - Gerador de Documentação Automática

**Gere documentação completa e detalhada para repositórios GitHub utilizando IA**

## 📋 Sobre

O AutoDoc é uma ferramenta que automatiza a criação de documentação técnica para repositórios de código no GitHub. Utilizando modelos de linguagem (LLMs), ele analisa o código-fonte, estrutura de diretórios e outros metadados para gerar documentação abrangente e de alta qualidade.

## ✨ Funcionalidades

- ✅ **Processamento automatizado** de repositórios GitHub
- 🔄 **Integração flexível** com diferentes modelos de IA (OpenAI, modelos locais)
- 📊 **Análise inteligente** de código e estrutura de diretórios
- 📄 **Documentação em múltiplos formatos** (Markdown e HTML)
- 🧠 **Detecção automática** de linguagens, padrões e componentes
- ⚙️ **Processamento em lote** para lidar com repositórios grandes
- 🐳 **Containerização** completa para fácil implantação

## 🚀 Como Começar

### Pré-requisitos

- Docker e Docker Compose
- Token de acesso do GitHub
- Chave de API OpenAI (se usar a integração com API)

### Instalação

1. Clone este repositório:

   ```bash
   git clone https://github.com/seu-usuario/autodoc.git
   cd autodoc
   ```

2. Configure suas variáveis de ambiente:

   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais
   ```

3. Execute o script de inicialização:

   ```bash
   ./start.sh -o owner -r repo -b branch -t your_github_token -k your_llm_api_key
   ```

## 🛠️ Uso

### Via Script de Inicialização

A maneira mais simples de usar o AutoDoc é através do script `start.sh`:

```bash
./start.sh --owner microsoft --repo vscode --branch main --token ghp_yourgithubtoken --key your_api_key
```

### Opções Disponíveis

- `-o, --owner`: Proprietário do repositório
- `-r, --repo`: Nome do repositório
- `-b, --branch`: Branch do repositório (default: main)
- `-t, --token`: Token de acesso GitHub
- `-k, --key`: Chave de API (para OpenAI ou outro provedor)
- `-l, --local`: Usar modelo local em vez de API
- `--html`: Gerar saída em HTML (default: markdown)

### Via Docker Diretamente

Você também pode usar o Docker manualmente:

```bash
# Construir a imagem
docker build -t autodoc .

# Executar o contêiner
docker run -v ./output:/app/output -e GITHUB_TOKEN=your_token -e REPO_OWNER=owner -e REPO_NAME=repo autodoc
```

## ⚙️ Configuração

O AutoDoc pode ser configurado através de variáveis de ambiente no arquivo `.env`. Principais configurações:

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `GITHUB_TOKEN` | Token de acesso GitHub | - |
| `REPO_OWNER` | Proprietário do repositório | - |
| `REPO_NAME` | Nome do repositório | - |
| `REPO_BRANCH` | Branch do repositório | main |
| `LLM_TYPE` | Tipo de modelo (api, local, hybrid) | api |
| `LLM_API_KEY` | Chave de API para modelos remotos | - |
| `LLM_API_URL` | URL da API do LLM | <https://api.openai.com/v1> |
| `LOCAL_MODEL_PATH` | Caminho para modelo local | - |
| `MAX_FILE_SIZE_KB` | Tamanho máx. de arquivo (KB) | 500 |
| `OUTPUT_FORMAT` | Formato de saída (markdown, html) | markdown |

## 📦 Estrutura do Projeto

```
./
├── Dockerfile             # Configuração Docker
├── docker-compose.yml     # Configuração Docker Compose
├── package.json           # Dependências do projeto
├── tsconfig.json          # Configuração TypeScript
├── start.sh               # Script de inicialização
├── src/                   # Código fonte
│   ├── index.ts           # Ponto de entrada
│   ├── config.ts          # Configurações
│   ├── github/            # Integração com GitHub
│   │   ├── api.ts         # Cliente API
│   │   └── repo-processor.ts # Processador de repositórios
│   ├── llm/               # Integração com modelos de linguagem
│   │   ├── model-loader.ts # Carregador de modelos
│   │   ├── api-llm.ts     # Implementação de API
│   │   └── local-llm.ts   # Implementação local
│   ├── documentation/     # Geração de documentação
│   │   ├── generator.ts   # Gerador de documentação
│   │   ├── formatters/    # Formatadores de saída
│   │   └── templates/     # Templates
│   └── utils/             # Utilitários
│       ├── batching.ts    # Processamento em lote
│       ├── file-utils.ts  # Utilitários de arquivo
│       └── logger.ts      # Sistema de log
└── output/                # Saída da documentação
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos para contribuir:

1. Faça um fork do projeto
2. Crie sua branch de funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📃 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## 📧 Contato

Para dúvidas ou sugestões, entre em contato através de issues no GitHub.

---

Desenvolvido com ❤️ para facilitar a documentação de projetos.
