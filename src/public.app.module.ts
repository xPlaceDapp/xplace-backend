import { Module } from '@nestjs/common';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/number.extensions';
import '@multiversx/sdk-nestjs/lib/src/utils/extensions/string.extensions';
import { EndpointsServicesModule } from './endpoints/endpoints.services.module';
import { EndpointsControllersModule } from './endpoints/endpoints.controllers.module';
import { DynamicModuleUtils } from './utils/dynamic.module.utils';
import {CachingModule, LoggingModule} from '@multiversx/sdk-nestjs';

@Module({
  imports: [
    LoggingModule,
    DynamicModuleUtils.getCachingModule(),
    EndpointsServicesModule,
    EndpointsControllersModule,
  ],
  providers: [
    DynamicModuleUtils.getNestJsApiConfigService(),
  ],
  exports: [
    EndpointsServicesModule,
    CachingModule,
  ],
})
export class PublicAppModule { }
