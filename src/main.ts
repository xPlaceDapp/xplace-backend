import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { readFileSync } from 'fs'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { join } from 'path'
import { ApiConfigService } from './common/api-config/api.config.service'
import { PublicAppModule } from './public.app.module'
import * as bodyParser from 'body-parser'
import { Logger, type NestInterceptor } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { SdkNestjsConfigServiceImpl } from './common/api-config/sdk.nestjs.config.service.impl'
import { MetricsService, NativeAuthGuard, LoggingInterceptor, CachingService, CachingInterceptor, LoggerInitializer } from '@multiversx/sdk-nestjs'

async function bootstrap(): Promise<void> {
  const publicApp = await NestFactory.create(PublicAppModule)
  publicApp.use(bodyParser.json({ limit: '1mb' }))
  publicApp.enableCors()
  publicApp.useLogger(publicApp.get(WINSTON_MODULE_NEST_PROVIDER))
  publicApp.use(cookieParser())

  const apiConfigService = publicApp.get<ApiConfigService>(ApiConfigService)
  const cachingService = publicApp.get<CachingService>(CachingService)
  const metricsService = publicApp.get<MetricsService>(MetricsService)
  const httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost)

  if (apiConfigService.getIsAuthActive()) {
    publicApp.useGlobalGuards(new NativeAuthGuard(new SdkNestjsConfigServiceImpl(apiConfigService), cachingService))
  }

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer()
  httpServer.keepAliveTimeout = apiConfigService.getServerTimeout()
  httpServer.headersTimeout = apiConfigService.getHeadersTimeout() // `keepAliveTimeout + server's expected response time`

  const globalInterceptors: NestInterceptor[] = []
  globalInterceptors.push(new LoggingInterceptor(metricsService))

  if (apiConfigService.getUseCachingInterceptor()) {
    const cachingInterceptor = new CachingInterceptor(
      cachingService,
      httpAdapterHostService,
      metricsService
    )

    globalInterceptors.push(cachingInterceptor)
  }

  publicApp.useGlobalInterceptors(...globalInterceptors)

  const description = readFileSync(join(__dirname, '..', 'docs', 'swagger.md'), 'utf8')

  let documentBuilder = new DocumentBuilder()
    .setTitle('MultiversX Microservice API')
    .setDescription(description)
    .setVersion('1.0.0')
    .setExternalDoc('MultiversX Docs', 'https://docs.multiversx.com')

  const apiUrls = apiConfigService.getSwaggerUrls()
  for (const apiUrl of apiUrls) {
    documentBuilder = documentBuilder.addServer(apiUrl)
  }

  const config = documentBuilder.build()

  const document = SwaggerModule.createDocument(publicApp, config)
  SwaggerModule.setup('', publicApp, document)

  if (apiConfigService.getIsPublicApiFeatureActive()) {
    await publicApp.listen(apiConfigService.getPublicApiFeaturePort())
  }

  const logger = new Logger('Bootstrapper')

  LoggerInitializer.initialize(logger)

  logger.log(`Public API active: ${apiConfigService.getIsPublicApiFeatureActive().toString()}`)
  logger.log(`Private API active: ${apiConfigService.getIsPrivateApiFeatureActive().toString()}`)
  logger.log(`Transaction processor active: ${apiConfigService.getIsTransactionProcessorFeatureActive().toString()}`)
  logger.log(`Cache warmer active: ${apiConfigService.getIsCacheWarmerFeatureActive().toString()}`)
  logger.log(`Queue worker active: ${apiConfigService.getIsQueueWorkerFeatureActive().toString()}`)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
