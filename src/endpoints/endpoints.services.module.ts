import { Module } from "@nestjs/common";
import {PixelsModule} from "./pixels/pixels.module";
import {ApiConfigModule} from "../common/api-config/api.config.module";
@Module({
  imports: [
      PixelsModule,
      ApiConfigModule,
  ],
  exports: [
    PixelsModule,
    ApiConfigModule,
  ],
})
export class EndpointsServicesModule { }
