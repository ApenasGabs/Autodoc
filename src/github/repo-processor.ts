import fs from "fs/promises";
import * as globModule from "glob";
import path from "path";
import config from "../config";
import { batchProcess } from "../utils/batching";
import { createLogger } from "../utils/logger";

const logger = createLogger("RepoProcessor");
// Usar a função glob diretamente do módulo
const { glob } = globModule;

export interface ProcessedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export class RepoProcessor {
  /**
   * Processa um repositório clonado, extraindo arquivos relevantes
   */
  async processRepository(repoPath: string): Promise<ProcessedFile[]> {
    logger.info(`Processando repositório em: ${repoPath}`);

    try {
      // Obter todos os arquivos, excluindo os padrões definidos
      const files = await this.getAllFiles(repoPath);
      logger.info(`Encontrados ${files.length} arquivos para processar`);

      // Reduzir o tamanho do lote para evitar problemas de memória
      const batchSize = Math.min(5, config.processing.maxConcurrentProcesses);
      logger.info(`Usando tamanho de lote: ${batchSize} para processamento`);

      // Processar arquivos em lotes para evitar sobrecarga de memória
      const processedFiles = await batchProcess(
        files,
        async (file) => this.processFile(file, repoPath),
        batchSize
      );

      return processedFiles.filter(Boolean) as ProcessedFile[];
    } catch (error) {
      logger.error(`Erro ao processar repositório: ${error}`);
      throw new Error(`Falha ao processar repositório: ${error}`);
    }
  }

  /**
   * Obtém todos os arquivos do repositório, excluindo padrões configurados
   */
  private async getAllFiles(repoPath: string): Promise<string[]> {
    const excludePatterns = config.processing.excludePatterns.map(
      (pattern) => `**/${pattern}/**`
    );

    // Adicionar mais padrões de exclusão para arquivos que podem causar problemas de memória
    const additionalExclusions = [
      "**/*.min.js",
      "**/*.bundle.js",
      "**/*.map",
      "**/*.svg",
      "**/*.woff",
      "**/*.woff2",
      "**/*.ttf",
      "**/*.eot",
      "**/*.jpg",
      "**/*.jpeg",
      "**/*.png",
      "**/*.gif",
      "**/*.ico",
      "**/*.lock",
    ];

    const allExclusions = [...excludePatterns, ...additionalExclusions];

    return new Promise<string[]>((resolve, reject) => {
      globModule.glob(
        "**/*.*",
        {
          cwd: repoPath,
          ignore: allExclusions,
          nodir: true,
          absolute: true,
        },
        (err: Error | null, files: string[]) => {
          if (err) reject(err);
          else resolve(files);
        }
      );
    });
  }

  /**
   * Processa um único arquivo
   */
  private async processFile(
    filePath: string,
    repoPath: string
  ): Promise<ProcessedFile | null> {
    try {
      const stats = await fs.stat(filePath);

      // Reduzir o tamanho máximo de arquivo para prevenir problemas de memória
      const maxSizeKb = Math.min(250, config.processing.maxFileSizeKb);

      // Pular arquivos muito grandes
      if (stats.size > maxSizeKb * 1024) {
        logger.warn(
          `Arquivo muito grande (${Math.round(
            stats.size / 1024
          )}KB), pulando: ${filePath}`
        );
        return null;
      }

      // Usar um limite de conteúdo para arquivos grandes
      const MAX_CONTENT_LENGTH = 500 * 1024; // 500 KB máximo

      let content: string;
      if (stats.size > MAX_CONTENT_LENGTH) {
        // Para arquivos grandes, ler apenas o início e o final
        const buffer = Buffer.alloc(MAX_CONTENT_LENGTH);
        const fd = await fs.open(filePath, "r");

        try {
          // Ler o início do arquivo
          await fd.read(buffer, 0, MAX_CONTENT_LENGTH / 2, 0);

          // Ler o final do arquivo
          await fd.read(
            buffer,
            MAX_CONTENT_LENGTH / 2,
            MAX_CONTENT_LENGTH / 2,
            Math.max(0, stats.size - MAX_CONTENT_LENGTH / 2)
          );

          content = buffer.toString("utf-8");
          content =
            content.slice(0, MAX_CONTENT_LENGTH / 2) +
            "\n\n... [conteúdo truncado devido ao tamanho do arquivo] ...\n\n" +
            content.slice(MAX_CONTENT_LENGTH / 2);
        } finally {
          await fd.close();
        }
      } else {
        // Para arquivos menores, ler normalmente
        content = await fs.readFile(filePath, "utf-8");
      }

      const relativePath = path.relative(repoPath, filePath);
      const extension = path.extname(filePath).substring(1);

      return {
        path: relativePath,
        content,
        language: this.getLanguageFromExtension(extension),
        size: stats.size,
      };
    } catch (error) {
      logger.error(`Erro ao processar arquivo ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Identifica a linguagem com base na extensão do arquivo
   */
  private getLanguageFromExtension(extension: string): string {
    const extensionMap: Record<string, string> = {
      js: "JavaScript",
      ts: "TypeScript",
      jsx: "React JSX",
      tsx: "React TSX",
      py: "Python",
      java: "Java",
      c: "C",
      cpp: "C++",
      cs: "C#",
      go: "Go",
      rb: "Ruby",
      php: "PHP",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      md: "Markdown",
      yml: "YAML",
      yaml: "YAML",
      sh: "Shell",
      sql: "SQL",
      rs: "Rust",
      swift: "Swift",
      kt: "Kotlin",
    };

    return extensionMap[extension.toLowerCase()] || "Unknown";
  }
}
