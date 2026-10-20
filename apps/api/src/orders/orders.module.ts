import { Module } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { PubSubService } from "../messaging/pubsub.service"; // Importe o serviço

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PubSubService], // Adicione aqui nos providers
  exports: [OrdersService],
})
export class OrdersModule {}