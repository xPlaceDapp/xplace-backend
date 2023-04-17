import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { EndpointsServicesModule } from "./endpoints.services.module";
import {PixelsController} from "./pixels/pixels.controller";

@Module({
  imports: [
    EndpointsServicesModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  controllers: [
    PixelsController,
  ],
})
export class EndpointsControllersModule { }
