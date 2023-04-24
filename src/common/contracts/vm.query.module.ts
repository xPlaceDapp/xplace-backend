import { Module } from '@nestjs/common'
import { VmQueryService } from './vm.query.service'

@Module({
  providers: [
    VmQueryService
  ],
  exports: [
    VmQueryService
  ]
})
export class VmQueryModule { }
