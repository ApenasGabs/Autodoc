import config from "../config";
import { createLogger } from "../utils/logger";
import { ApiLLM } from "./api-llm";
import { LocalLLM } from "./local-llm";

const logger = createLogger("ModelLoader");

export interface LLMInterface {
  generateCompletion(prompt: string): Promise<string>;
  batchProcess(prompts: string[]): Promise<string[]>;
}

export class ModelLoader {
  async loadModel(): Promise<LLMInterface> {
    const { type } = config.llm;

    logger.info(`Carregando modelo LLM do tipo: ${type}`);

    switch (type) {
      case "local":
        if (!config.llm.localModelPath && !process.env.OLLAMA_MODEL) {
          throw new Error(
            "Modelo local não configurado. Defina LOCAL_MODEL_PATH ou OLLAMA_MODEL"
          );
        }

        // Se tiver OLLAMA_MODEL definido, usa o Ollama
        if (process.env.OLLAMA_MODEL) {
          logger.info(`Usando modelo Ollama: ${process.env.OLLAMA_MODEL}`);
          const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
          const llm = new LocalLLM(process.env.OLLAMA_MODEL, ollamaUrl);
          await llm.initialize();
          return llm;
        }

        // Caso contrário, usa o modelo de arquivo
        return new LocalLLM(config.llm.localModelPath!);

      case "api":
        if (!config.llm.apiKey) {
          throw new Error("Chave de API não configurada");
        }
        return new ApiLLM(config.llm.apiKey, config.llm.apiBaseUrl);

      case "hybrid":
        // No modo híbrido, tentamos primeiro usar o Ollama, depois a API
        if (process.env.OLLAMA_MODEL) {
          try {
            logger.info(
              `Usando modelo Ollama no modo híbrido: ${process.env.OLLAMA_MODEL}`
            );
            const ollamaUrl =
              process.env.OLLAMA_URL || "http://localhost:11434";
            const llm = new LocalLLM(process.env.OLLAMA_MODEL, ollamaUrl);
            await llm.initialize();
            return llm;
          } catch (error) {
            logger.warn(
              `Falha ao inicializar Ollama, caindo para API: ${error}`
            );
          }
        }

        if (!config.llm.apiKey) {
          throw new Error("Chave de API não configurada para modo híbrido");
        }
        return new ApiLLM(config.llm.apiKey, config.llm.apiBaseUrl);

      default:
        throw new Error(`Tipo de modelo desconhecido: ${type}`);
    }
  }
}
