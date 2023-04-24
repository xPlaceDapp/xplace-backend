import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiConfigModule } from '../api-config/api.config.module'
import { ApiConfigService } from '../api-config/api.config.service'
import { PixelEntity } from '../../endpoints/pixels/entity/pixel.entity'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => ({
        type: 'mysql',
        ...apiConfigService.getDatabaseConnection(),
        entities: [
          PixelEntity
        ],
        keepConnectionAlive: true,
        synchronize: true
      }),
      inject: [ApiConfigService]
    }),
    TypeOrmModule.forFeature([
      PixelEntity
    ])
  ],
  exports: [
    TypeOrmModule.forFeature([
      PixelEntity
    ])
  ]
})
export class DatabaseModule { }
