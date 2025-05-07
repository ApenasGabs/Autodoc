import fs from "fs/promises";
import path from "path";
import { createLogger } from "./logger";

const logger = createLogger("FileUtils");

/**
 * Utilitários para manipulação de arquivos
 */
export class FileUtils {
  /**
   * Lê o conteúdo de um arquivo
   * @param filePath Caminho do arquivo
   * @returns Conteúdo do arquivo como string
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      logger.error(`Erro ao ler arquivo ${filePath}: ${error}`);
      throw new Error(`Falha ao ler arquivo: ${error}`);
    }
  }

  /**
   * Escreve conteúdo em um arquivo
   * @param filePath Caminho do arquivo
   * @param content Conteúdo a ser escrito
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Garantir que o diretório exista
      await this.ensureDirectoryExists(path.dirname(filePath));

      await fs.writeFile(filePath, content, "utf-8");
      logger.debug(`Arquivo escrito com sucesso: ${filePath}`);
    } catch (error) {
      logger.error(`Erro ao escrever arquivo ${filePath}: ${error}`);
      throw new Error(`Falha ao escrever arquivo: ${error}`);
    }
  }

  /**
   * Garante que um diretório exista, criando-o se necessário
   * @param dirPath Caminho do diretório
   */
  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Erro ao criar diretório ${dirPath}: ${error}`);
      throw new Error(`Falha ao criar diretório: ${error}`);
    }
  }

  /**
   * Lista arquivos em um diretório de forma recursiva
   * @param dirPath Caminho do diretório
   * @param filter Função opcional para filtrar arquivos
   * @returns Lista de caminhos de arquivos
   */
  static async listFilesRecursively(
    dirPath: string,
    filter?: (filePath: string) => boolean
  ): Promise<string[]> {
    const result: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const nestedFiles = await this.listFilesRecursively(fullPath, filter);
          result.push(...nestedFiles);
        } else if (!filter || filter(fullPath)) {
          result.push(fullPath);
        }
      }
    } catch (error) {
      logger.error(`Erro ao listar arquivos em ${dirPath}: ${error}`);
    }

    return result;
  }

  /**
   * Copia um arquivo
   * @param sourcePath Caminho de origem
   * @param targetPath Caminho de destino
   */
  static async copyFile(sourcePath: string, targetPath: string): Promise<void> {
    try {
      // Garantir que o diretório de destino exista
      await this.ensureDirectoryExists(path.dirname(targetPath));

      await fs.copyFile(sourcePath, targetPath);
      logger.debug(
        `Arquivo copiado com sucesso: ${sourcePath} -> ${targetPath}`
      );
    } catch (error) {
      logger.error(`Erro ao copiar arquivo ${sourcePath}: ${error}`);
      throw new Error(`Falha ao copiar arquivo: ${error}`);
    }
  }

  /**
   * Remove um arquivo ou diretório (recursivamente)
   * @param filePath Caminho do arquivo ou diretório
   */
  static async remove(filePath: string): Promise<void> {
    try {
      await fs.rm(filePath, { recursive: true, force: true });
      logger.debug(`Removido com sucesso: ${filePath}`);
    } catch (error) {
      logger.error(`Erro ao remover ${filePath}: ${error}`);
      throw new Error(`Falha ao remover: ${error}`);
    }
  }
}
