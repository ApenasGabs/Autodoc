import { createLogger } from "./logger";

const logger = createLogger("BatchProcessor");

/**
 * Processa um array de itens em lotes, com um número máximo de processamentos concorrentes
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const total = items.length;

  logger.info(
    `Iniciando processamento em lote de ${total} itens com concorrência máxima de ${concurrency}`
  );

  // Implementação com limitação de concorrência
  const queue = [...items];
  const inProgress: Promise<void>[] = [];

  while (queue.length > 0 || inProgress.length > 0) {
    // Enquanto houver espaço na fila de processamento, adicione mais itens
    while (inProgress.length < concurrency && queue.length > 0) {
      const item = queue.shift()!;

      const promise = (async () => {
        try {
          const result = await processor(item);
          results.push(result);
          logger.debug(
            `Item processado com sucesso (${results.length}/${total})`
          );
        } catch (error) {
          logger.error(`Erro ao processar item: ${error}`);
        }
      })();

      inProgress.push(promise);
    }

    // Aguarde pelo menos uma promessa concluir
    if (inProgress.length > 0) {
      await Promise.race(inProgress.map((p) => p.then(() => {})));

      // Remova as promessas concluídas
      for (let i = inProgress.length - 1; i >= 0; i--) {
        const promise = inProgress[i];
        if (isPromiseFinished(promise)) {
          inProgress.splice(i, 1);
        }
      }
    }
  }

  logger.info(
    `Processamento em lote concluído: ${results.length} itens processados com sucesso`
  );
  return results;
}

/**
 * Verifica se uma promessa já está concluída
 * Nota: esta é uma verificação de "melhor esforço" já que não é possível verificar com certeza
 */
function isPromiseFinished(promise: Promise<any>): boolean {
  const state = (promise as any)._state;
  return state === 1 || state === 2; // 1 = cumprida, 2 = rejeitada
}
