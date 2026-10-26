import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PubSub } from "@google-cloud/pubsub";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PubSubService implements OnModuleInit {
  private readonly logger = new Logger(PubSubService.name);
  private pubsub: PubSub | null = null;
  private enabled = false;
  private topicName = "order-confirmed-topic";
  private subscriptionName = "order-confirmed-topic-sub";

  onModuleInit() {
    const projectId =
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.GCP_PROJECT;

    if (!projectId) {
      this.logger.warn(
        "Pub/Sub desativado (sem GOOGLE_CLOUD_PROJECT). Pedidos seguem normalmente; eventos só no JSON local."
      );
      return;
    }

    try {
      this.pubsub = new PubSub({ projectId });
      this.enabled = true;
      this.listenForMessages();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Pub/Sub não iniciado: ${msg}`);
    }
  }

  async publishOrderMessage(orderData: any) {
    // Sempre persiste localmente (mineração / auditoria)
    this.saveEventToJson(orderData);

    if (!this.enabled || !this.pubsub) {
      this.logger.log(
        `Pedido ${orderData.orderId} registrado localmente (Pub/Sub offline).`
      );
      return;
    }

    try {
      const dataBuffer = Buffer.from(JSON.stringify(orderData));
      const messageId = await this.pubsub
        .topic(this.topicName)
        .publishMessage({ data: dataBuffer });
      this.logger.log(
        `[GOOGLE CLOUD PUB/SUB] Mensagem publicada com ID: ${messageId}`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao publicar no Pub/Sub: ${errorMessage}`);
    }
  }

  private listenForMessages() {
    if (!this.pubsub) return;
    try {
      const subscription = this.pubsub.subscription(this.subscriptionName);

      subscription.on("message", (message: any) => {
        const data = JSON.parse(message.data.toString());

        console.log(
          `\n================ MENSAGERIA CLOUD (PUB/SUB) ================`
        );
        console.log(`Mensagem consumida da nuvem com sucesso!`);
        console.log(`Pedido ID: ${data.orderId}`);
        console.log(`Usuario ID: ${data.userId}`);
        console.log(`Valor Total: R$ ${data.total}`);
        console.log(`Itens:`, data.items);
        console.log(
          `============================================================\n`
        );

        this.saveEventToJson(data);
        message.ack();
      });

      subscription.on("error", (error: any) => {
        this.logger.error(`Erro na assinatura do Pub/Sub: ${error.message}`);
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao iniciar escuta do Pub/Sub: ${errorMessage}`);
    }
  }

  private saveEventToJson(eventData: any) {
    try {
      const dirPath = path.join(process.cwd(), "data");
      const filePath = path.join(dirPath, "orders_events.json");

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      let events: unknown[] = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf8");
        try {
          const parsed = JSON.parse(fileContent);
          events = Array.isArray(parsed) ? parsed : [];
        } catch {
          events = [];
        }
      }

      events.push({
        savedAt: new Date().toISOString(),
        ...eventData,
      });

      fs.writeFileSync(filePath, JSON.stringify(events, null, 2), "utf8");
      this.logger.log(`Evento gravado em apps/api/data/orders_events.json`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Erro ao salvar evento localmente: ${errorMessage}`);
    }
  }
}
