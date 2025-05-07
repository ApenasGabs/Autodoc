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
        if (!config.llm.localModelPath) {
          throw new Error("Caminho do modelo local não configurado");
        }
        return new LocalLLM(config.llm.localModelPath);

      case "api":
        if (!config.llm.apiKey) {
          throw new Error("Chave de API não configurada");
        }
        return new ApiLLM(config.llm.apiKey, config.llm.apiBaseUrl);

      case "hybrid":
        // No modo híbrido, usamos principalmente a API, mas podemos
        // adicionar lógica para decidir quando usar o modelo local
        if (!config.llm.apiKey) {
          throw new Error("Chave de API não configurada para modo híbrido");
        }
        return new ApiLLM(config.llm.apiKey, config.llm.apiBaseUrl);

      default:
        throw new Error(`Tipo de modelo desconhecido: ${type}`);
    }
  }
}
