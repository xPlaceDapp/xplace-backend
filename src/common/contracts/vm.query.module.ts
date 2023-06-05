import { Module } from '@nestjs/common'
import { VmQueryService } from './vm.query.service'
import { ApiConfigModule } from '../api-config/api.config.module'

@Module({
  imports: [
    ApiConfigModule
  ],
  providers: [
    VmQueryService
  ],
  exports: [
    VmQueryService
  ]
})
export class VmQueryModule { }
