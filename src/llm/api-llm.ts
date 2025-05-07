import axios from "axios";
import { batchProcess } from "../utils/batching";
import { createLogger } from "../utils/logger";
import { LLMInterface } from "./model-loader";

const logger = createLogger("ApiLLM");

export class ApiLLM implements LLMInterface {
  private apiKey: string;
  private apiBaseUrl: string;

  constructor(apiKey: string, apiBaseUrl = "https://api.openai.com/v1") {
    this.apiKey = apiKey;
    this.apiBaseUrl = apiBaseUrl || "https://api.openai.com/v1";
  }

  async generateCompletion(prompt: string): Promise<string> {
    try {
      // Adapte conforme a API que você está usando (OpenAI, Claude, etc.)
      const response = await axios.post(
        `${this.apiBaseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo", // Ou outro modelo de sua escolha
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente especializado em gerar documentação técnica detalhada e precisa para código-fonte.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error(`Erro na API LLM: ${error.message}`);

      // Em caso de erro de taxa ou token, espere um pouco e tente novamente
      if (
        error.response &&
        (error.response.status === 429 || error.response.status === 401)
      ) {
        logger.warn(
          "Erro de taxa ou autenticação, aguardando 5 segundos e tentando novamente..."
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return this.generateCompletion(prompt);
      }

      throw new Error(`Falha ao gerar texto: ${error.message}`);
    }
  }

  async batchProcess(prompts: string[]): Promise<string[]> {
    // Processa os prompts em lotes para evitar sobrecarregar a API
    return batchProcess(
      prompts,
      async (prompt) => this.generateCompletion(prompt),
      3 // Máximo de 3 requisições simultâneas
    );
  }
}
