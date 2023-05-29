import { Module } from '@nestjs/common'
import { PixelsController } from './pixels.controller'
import { PixelsService } from './pixels.service'
import { VmQueryModule } from '../../common/contracts/vm.query.module'
import { DatabaseModule } from '../../common/database/database.module'
import { ElasticModule } from '../../common/elastic/elastic.module'

@Module({
  imports: [
    VmQueryModule,
    DatabaseModule,
    ElasticModule
  ],
  controllers: [
    PixelsController
  ],
  providers: [
    PixelsService
  ],
  exports: [
    PixelsService
  ]
})
export class PixelsModule {}
