import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => ({
        type: 'mysql',
        ...apiConfigService.getDatabaseConnection(),
        entities: [],
        keepConnectionAlive: true,
        synchronize: true,
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([]),
  ],
  exports: [
    TypeOrmModule.forFeature([]),
  ],
})
export class DatabaseModule { }
