import axios from "axios";
import { createLogger } from "../utils/logger";
import { LLMInterface } from "./model-loader";

const logger = createLogger("LocalLLM");

export class LocalLLM implements LLMInterface {
  private modelName: string;
  private ollamaUrl: string;

  constructor(modelName: string, ollamaUrl: string = "http://localhost:11434") {
    this.modelName = modelName;
    this.ollamaUrl = ollamaUrl;
    logger.info(`Inicializando modelo Ollama: ${modelName} via ${ollamaUrl}`);
  }

  async initialize() {
    try {
      // Verificar se o modelo está disponível no Ollama
      const response = await axios.get(`${this.ollamaUrl}/api/tags`);
      const availableModels = response.data.models || [];
      const modelExists = availableModels.some(
        (model: any) => model.name === this.modelName
      );

      if (!modelExists) {
        logger.warn(
          `Modelo ${
            this.modelName
          } não encontrado no Ollama. Disponíveis: ${availableModels
            .map((m: any) => m.name)
            .join(", ")}`
        );
      } else {
        logger.info(`Modelo ${this.modelName} encontrado no Ollama`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar modelos disponíveis no Ollama: ${error}`);
      logger.warn(
        "Verifique se o Ollama está em execução em " + this.ollamaUrl
      );
    }
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      logger.info(
        `Gerando completamento com Ollama (${this.modelName}) para prompt com ${prompt.length} caracteres`
      );

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Diminuir para resultados mais determinísticos
          num_predict: 4096, // Aumentar para respostas mais longas
          stop: ["```", "</code>"], // Adicionar tokens de parada para melhor formatação
          top_p: 0.9, // Ajuste de diversidade do texto
          top_k: 40, // Ajuste de variedade dos tokens
        },
      });

      // Ollama retorna o texto gerado em resposta.data.response
      return response.data.response;
    } catch (error: any) {
      logger.error(`Erro ao gerar texto com Ollama: ${error.message}`);
      if (error.response) {
        logger.error(`Detalhes: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(
        `Falha ao gerar texto com modelo local: ${error.message}`
      );
    }
  }

  async batchProcess(prompts: string[]): Promise<string[]> {
    const results: string[] = [];
    logger.info(`Processando batch de ${prompts.length} prompts com Ollama`);

    // Com Ollama, melhor processar serialmente para não sobrecarregar
    for (const prompt of prompts) {
      results.push(await this.generateCompletion(prompt));
    }

    return results;
  }
}
