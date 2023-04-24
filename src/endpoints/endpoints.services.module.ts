import { Module } from '@nestjs/common'
import { PixelsModule } from './pixels/pixels.module'
import { ApiConfigModule } from '../common/api-config/api.config.module'
import { VmQueryModule } from '../common/contracts/vm.query.module'
@Module({
  imports: [
    PixelsModule,
    ApiConfigModule,
    VmQueryModule
  ],
  exports: [
    PixelsModule,
    ApiConfigModule
  ]
})
export class EndpointsServicesModule { }
