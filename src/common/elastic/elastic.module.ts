import { Module } from '@nestjs/common'
import { ElasticService } from './elastic.service'
import { ApiConfigModule } from '../api-config/api.config.module'

@Module({
  imports: [
    ApiConfigModule
  ],
  providers: [
    ElasticService
  ],
  exports: [
    ElasticService
  ]
})
export class ElasticModule {}
