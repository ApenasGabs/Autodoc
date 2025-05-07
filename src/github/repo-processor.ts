import fs from "fs/promises";
import glob from "glob";
import path from "path";
import config from "../config";
import { batchProcess } from "../utils/batching";
import { createLogger } from "../utils/logger";

const logger = createLogger("RepoProcessor");

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

      // Processar arquivos em lotes para evitar sobrecarga de memória
      const processedFiles = await batchProcess(
        files,
        async (file) => this.processFile(file, repoPath),
        config.processing.maxConcurrentProcesses
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

    return new Promise((resolve, reject) => {
      glob(
        "**/*.*",
        {
          cwd: repoPath,
          ignore: excludePatterns,
          nodir: true,
          absolute: true,
        },
        (err, files) => {
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

      // Pular arquivos muito grandes
      if (stats.size > config.processing.maxFileSizeKb * 1024) {
        logger.warn(`Arquivo muito grande, pulando: ${filePath}`);
        return null;
      }

      const content = await fs.readFile(filePath, "utf-8");
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
