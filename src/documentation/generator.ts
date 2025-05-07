import fs from "fs/promises";
import path from "path";
import config from "../config";
import { ProcessedFile } from "../github/repo-processor";
import { LLMInterface } from "../llm/model-loader";
import { createLogger } from "../utils/logger";
import { HtmlFormatter } from "./formatters/html";
import { MarkdownFormatter } from "./formatters/markdown";

const logger = createLogger("DocGenerator");

export interface DocumentationFormatter {
  formatDocumentation(title: string, content: string): string;
  formatIndex(
    title: string,
    sections: { title: string; path: string }[]
  ): string;
  getFileExtension(): string;
}

export class DocumentationGenerator {
  private llm: LLMInterface;
  private formatter: DocumentationFormatter;
  private outputDir: string;

  constructor(llm: LLMInterface) {
    this.llm = llm;
    this.outputDir = config.output.outputDir;

    // Selecionando o formatador com base na configuração
    this.formatter =
      config.output.format === "html"
        ? new HtmlFormatter()
        : new MarkdownFormatter();
  }

  /**
   * Gera documentação para um repositório inteiro
   */
  async generateDocumentation(
    repoInfo: any,
    files: ProcessedFile[]
  ): Promise<string> {
    logger.info(`Gerando documentação para ${files.length} arquivos`);

    // Garantir que o diretório de saída existe
    await fs.mkdir(this.outputDir, { recursive: true });

    // Gerar documentação para o repositório como um todo
    const overviewContent = await this.generateRepoOverview(repoInfo);
    const overviewPath = path.join(
      this.outputDir,
      `overview.${this.formatter.getFileExtension()}`
    );
    await fs.writeFile(overviewPath, overviewContent);

    // Agrupar arquivos por diretório para facilitar a organização
    const filesByDir = this.groupFilesByDirectory(files);

    // Gerar documentação para cada grupo de arquivos
    const sections = [];

    for (const [dirPath, dirFiles] of Object.entries(filesByDir)) {
      const dirName = dirPath || "root";
      const sanitizedDirName = dirName.replace(/[^\w-]/g, "_");

      logger.info(
        `Processando diretório: ${dirName} com ${dirFiles.length} arquivos`
      );

      // Gerar documentação para este diretório
      const dirContent = await this.generateDirectoryDoc(dirName, dirFiles);
      const dirOutputPath = path.join(
        this.outputDir,
        `${sanitizedDirName}.${this.formatter.getFileExtension()}`
      );
      await fs.writeFile(dirOutputPath, dirContent);

      sections.push({
        title: dirName,
        path: `${sanitizedDirName}.${this.formatter.getFileExtension()}`,
      });
    }

    // Gerar índice
    const indexContent = this.formatter.formatIndex(
      `Documentação: ${repoInfo.name}`,
      sections
    );
    const indexPath = path.join(
      this.outputDir,
      `index.${this.formatter.getFileExtension()}`
    );
    await fs.writeFile(indexPath, indexContent);

    return indexPath;
  }

  /**
   * Gera uma visão geral do repositório
   */
  private async generateRepoOverview(repoInfo: any): Promise<string> {
    const prompt = `
    Gere uma visão geral detalhada para este repositório de código.
    
    Detalhes do repositório:
    - Nome: ${repoInfo.name}
    - Descrição: ${repoInfo.description || "Não fornecida"}
    - Linguagem principal: ${repoInfo.language || "Não especificada"}
    - Estatísticas: ${repoInfo.stars} estrelas, ${repoInfo.forks} forks, ${
      repoInfo.issues
    } issues abertas
    - Criado em: ${repoInfo.createdAt}
    - Última atualização: ${repoInfo.updatedAt}
    - Licença: ${repoInfo.license}
    
    Forneça uma introdução completa ao repositório, explicando seu propósito, 
    recursos principais, e como ele pode ser utilizado. Inclua uma visão geral 
    da arquitetura do projeto.
    `;

    const content = await this.llm.generateCompletion(prompt);
    return this.formatter.formatDocumentation(
      `Visão Geral: ${repoInfo.name}`,
      content
    );
  }

  /**
   * Gera documentação para um diretório específico
   */
  private async generateDirectoryDoc(
    dirName: string,
    files: ProcessedFile[]
  ): Promise<string> {
    // Preparar informações resumidas sobre os arquivos para o contexto
    const fileInfos = files
      .map((f) => `- ${f.path} (${f.language}, ${Math.round(f.size / 1024)}KB)`)
      .join("\n");

    // Obter conteúdo completo dos arquivos, mas limitando o tamanho para não exceder o contexto
    const fileContents = files
      .map((f) => {
        // Limitar o tamanho do conteúdo para evitar exceder o contexto do modelo
        const maxContentLength = 2000; // Ajuste conforme necessário
        const content =
          f.content.length > maxContentLength
            ? `${f.content.substring(
                0,
                maxContentLength
              )}... [Conteúdo truncado]`
            : f.content;

        return `Arquivo: ${f.path}\nLinguagem: ${f.language}\n\n\`\`\`\n${content}\n\`\`\``;
      })
      .join("\n\n");

    const prompt = `
    Gere documentação detalhada para este diretório de código.
    
    Diretório: ${dirName}
    
    Arquivos neste diretório:
    ${fileInfos}
    
    Conteúdo dos arquivos:
    ${fileContents}
    
    Por favor, forneça:
    1. Uma visão geral do propósito deste diretório
    2. Descrição da funcionalidade implementada
    3. Explicação das relações entre os arquivos
    4. Descrição de classes/funções/módulos importantes
    5. Padrões de design utilizados
    6. Exemplos de uso (se aplicável)
    
    Formate o conteúdo de forma clara e organizada, com títulos e subtítulos apropriados.
    `;

    const content = await this.llm.generateCompletion(prompt);
    return this.formatter.formatDocumentation(
      `Documentação: ${dirName}`,
      content
    );
  }

  /**
   * Agrupa arquivos por diretório
   */
  private groupFilesByDirectory(
    files: ProcessedFile[]
  ): Record<string, ProcessedFile[]> {
    const result: Record<string, ProcessedFile[]> = {};

    for (const file of files) {
      const dirPath = path.dirname(file.path);

      if (!result[dirPath]) {
        result[dirPath] = [];
      }

      result[dirPath].push(file);
    }

    return result;
  }
}
