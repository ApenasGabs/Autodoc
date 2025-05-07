import fs from "fs/promises";
import config from "./config";
import { DocumentationGenerator } from "./documentation/generator";
import { GitHubAPI, RepoDetails } from "./github/api";
import { RepoProcessor } from "./github/repo-processor";
import { ModelLoader } from "./llm/model-loader";
import { createLogger } from "./utils/logger";

const logger = createLogger("App");

async function main() {
  // Verificar configurações
  if (!config.github.token) {
    logger.error(
      "Token do GitHub não configurado. Configure GITHUB_TOKEN no arquivo .env"
    );
    process.exit(1);
  }

  try {
    // Extrair informações do repositório da linha de comando ou da configuração
    const repoOwner = process.argv[2] || process.env.REPO_OWNER;
    const repoName = process.argv[3] || process.env.REPO_NAME;
    const repoBranch = process.argv[4] || process.env.REPO_BRANCH || "main";

    if (!repoOwner || !repoName) {
      logger.error("Proprietário ou nome do repositório não fornecido");
      logger.info("Uso: npm start <owner> <repo> [branch]");
      process.exit(1);
    }

    const repoDetails: RepoDetails = {
      owner: repoOwner,
      repo: repoName,
      branch: repoBranch,
    };

    logger.info(
      `Iniciando geração de documentação para ${repoOwner}/${repoName} (branch: ${repoBranch})`
    );

    // Inicializar API do GitHub
    const githubApi = new GitHubAPI();

    // Obter informações do repositório
    logger.info("Obtendo informações do repositório...");
    const repoInfo = await githubApi.getRepositoryInfo(repoDetails);

    // Clonar repositório
    logger.info("Clonando repositório...");
    const repoPath = await githubApi.cloneRepository(repoDetails);

    // Processar repositório
    logger.info("Processando arquivos do repositório...");
    const repoProcessor = new RepoProcessor();
    const files = await repoProcessor.processRepository(repoPath);

    logger.info(
      `Repositório processado: ${files.length} arquivos válidos encontrados`
    );

    // Carregar modelo LLM
    logger.info("Carregando modelo LLM...");
    const modelLoader = new ModelLoader();
    const llm = await modelLoader.loadModel();

    // Gerar documentação
    logger.info("Gerando documentação...");
    const docGenerator = new DocumentationGenerator(llm);
    const outputPath = await docGenerator.generateDocumentation(
      repoInfo,
      files
    );

    logger.info(`Documentação gerada com sucesso: ${outputPath}`);

    // Limpar arquivos temporários
    if (process.env.CLEAN_TEMP !== "false") {
      logger.info("Limpando arquivos temporários...");
      await cleanupTempFiles(repoPath);
    }

    logger.info("Processo concluído com sucesso!");
  } catch (error) {
    logger.error(`Erro ao gerar documentação: ${error}`);
    process.exit(1);
  }
}

async function cleanupTempFiles(repoPath: string) {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    logger.warn(`Erro ao limpar diretório temporário: ${error}`);
  }
}

// Executar o programa
main();
