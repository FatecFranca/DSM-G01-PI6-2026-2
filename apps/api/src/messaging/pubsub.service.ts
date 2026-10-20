import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PubSub } from '@google-cloud/pubsub';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PubSubService implements OnModuleInit {
  private readonly logger = new Logger(PubSubService.name);
  private pubsub: PubSub;
  private topicName = 'order-confirmed-topic';
  private subscriptionName = 'order-confirmed-topic-sub';

  constructor() {
    this.pubsub = new PubSub();
  }

  onModuleInit() {
    this.listenForMessages();
  }

  /**
   * Publica mensagem no tópico do Pub/Sub quando um pedido é feito
   */
  async publishOrderMessage(orderData: any) {
    try {
      const dataBuffer = Buffer.from(JSON.stringify(orderData));
      const messageId = await this.pubsub.topic(this.topicName).publishMessage({ data: dataBuffer });
      this.logger.log(`☁️ [GOOGLE CLOUD PUB/SUB] Mensagem publicada na nuvem com ID: ${messageId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao publicar mensagem no Pub/Sub: ${errorMessage}`);
    }
  }

  /**
   * Escuta a assinatura do Pub/Sub em tempo real
   */
  private listenForMessages() {
    try {
      const subscription = this.pubsub.subscription(this.subscriptionName);

      subscription.on('message', (message: any) => {
        const data = JSON.parse(message.data.toString());

        console.log(`\n================ MENSAGERIA CLOUD (PUB/SUB) ================`);
        console.log(`📥 [TERMINAL] Mensagem consumida da nuvem com sucesso!`);
        console.log(`📦 Pedido ID: ${data.orderId}`);
        console.log(`👤 Usuário ID: ${data.userId}`);
        console.log(`💰 Valor Total: R$ ${data.total}`);
        console.log(`📊 Itens capturados para mineração de regras de associação:`, data.items);
        console.log(`============================================================\n`);

        // Salva o evento consumido no JSON local
        this.saveEventToJson(data);

        message.ack();
      });

      subscription.on('error', (error: any) => {
        this.logger.error(`Erro na assinatura do Pub/Sub: ${error.message}`);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao iniciar escuta do Pub/Sub: ${errorMessage}`);
    }
  }

  /**
   * Grava o evento em arquivo JSON local para persistência permanente
   */
  private saveEventToJson(eventData: any) {
    try {
      const dirPath = path.join(process.cwd(), 'data');
      const filePath = path.join(dirPath, 'orders_events.json');

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      let events = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        try {
          events = JSON.parse(fileContent);
          if (!Array.isArray(events)) events = [];
        } catch (_) {
          events = [];
        }
      }

      events.push({
        savedAt: new Date().toISOString(),
        ...eventData,
      });

      fs.writeFileSync(filePath, JSON.stringify(events, null, 2), 'utf8');
      this.logger.log(`💾 Evento gravado com sucesso no JSON local (apps/api/data/orders_events.json)!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao salvar evento localmente: ${errorMessage}`);
    }
  }
}