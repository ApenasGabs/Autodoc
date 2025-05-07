import dotenv from "dotenv";
import path from "path";

dotenv.config();

export interface Config {
  github: {
    token: string;
    apiBaseUrl: string;
  };
  llm: {
    type: "local" | "api" | "hybrid";
    apiKey?: string;
    apiBaseUrl?: string;
    localModelPath?: string;
    contextWindow: number;
    batchSize: number;
  };
  processing: {
    maxFileSizeKb: number;
    maxConcurrentProcesses: number;
    excludePatterns: string[];
  };
  output: {
    format: "markdown" | "html";
    outputDir: string;
  };
}

const config: Config = {
  github: {
    token: process.env.GITHUB_TOKEN || "",
    apiBaseUrl: "https://api.github.com",
  },
  llm: {
    type: (process.env.LLM_TYPE as "local" | "api" | "hybrid") || "hybrid",
    apiKey: process.env.LLM_API_KEY,
    apiBaseUrl: process.env.LLM_API_URL,
    localModelPath: process.env.LOCAL_MODEL_PATH,
    contextWindow: parseInt(process.env.CONTEXT_WINDOW || "4096"),
    batchSize: parseInt(process.env.BATCH_SIZE || "10"),
  },
  processing: {
    maxFileSizeKb: parseInt(process.env.MAX_FILE_SIZE_KB || "500"),
    maxConcurrentProcesses: parseInt(
      process.env.MAX_CONCURRENT_PROCESSES || "2"
    ),
    excludePatterns: (
      process.env.EXCLUDE_PATTERNS || "node_modules,dist,build,.git"
    ).split(","),
  },
  output: {
    format: (process.env.OUTPUT_FORMAT as "markdown" | "html") || "markdown",
    outputDir: process.env.OUTPUT_DIR || path.join(process.cwd(), "output"),
  },
};

export default config;
