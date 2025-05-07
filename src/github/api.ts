import { Octokit } from "@octokit/rest";
import fs from "fs/promises";
import path from "path";
import simpleGit from "simple-git";
import config from "../config";
import { createLogger } from "../utils/logger";

const logger = createLogger("GithubAPI");
const octokit = new Octokit({ auth: config.github.token });
const git = simpleGit();

export interface RepoDetails {
  owner: string;
  repo: string;
  branch?: string;
}

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export class GitHubAPI {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), "temp");
  }

  /**
   * Clona um repositório do GitHub
   */
  async cloneRepository(details: RepoDetails): Promise<string> {
    const { owner, repo, branch = "main" } = details;
    const repoUrl = `https://github.com/${owner}/${repo}.git`;
    const targetDir = path.join(this.tempDir, `${owner}_${repo}`);

    logger.info(`Clonando repositório: ${repoUrl}`);

    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      await git.clone(repoUrl, targetDir, ["--depth", "1", "--branch", branch]);
      return targetDir;
    } catch (error) {
      logger.error(`Erro ao clonar repositório: ${error}`);
      throw new Error(`Falha ao clonar repositório: ${error}`);
    }
  }

  /**
   * Obtém informações básicas sobre o repositório
   */
  async getRepositoryInfo(details: RepoDetails) {
    const { owner, repo } = details;

    try {
      const { data } = await octokit.repos.get({ owner, repo });
      return {
        name: data.name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        issues: data.open_issues_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        license: data.license?.name || "Sem licença",
        defaultBranch: data.default_branch,
      };
    } catch (error) {
      logger.error(`Erro ao obter informações do repositório: ${error}`);
      throw new Error(`Falha ao obter informações do repositório: ${error}`);
    }
  }
}
