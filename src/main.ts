import type { ConfigKeyPaths } from './config'
import cluster from 'node:cluster'

import path from 'node:path'
import {
  HttpStatus,
  Logger,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'

import { NestExpressApplication } from '@nestjs/platform-express'

import { useContainer } from 'class-validator'

import { AppModule } from './app.module'
import { setupExpress } from './common/adapters/express.adapter'
import { RedisIoAdapter } from './common/adapters/socket.adapter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { isDev, isMainProcess } from './global/env'
import { setupSwagger } from './setup-swagger'
import { LoggerService } from './shared/logger/logger.service'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    {
      bufferLogs: true,
      snapshot: true,
    },
  )

  setupExpress(app.getHttpAdapter().getInstance())

  const configService = app.get(ConfigService<ConfigKeyPaths>)

  const { port, globalPrefix } = configService.get('app', { infer: true })

  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })

  app.setGlobalPrefix(globalPrefix)
  app.useStaticAssets(path.join(__dirname, '..', 'public'))
  !isDev && app.enableShutdownHooks()

  if (isDev) {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      stopAtFirstError: true,
      exceptionFactory: errors =>
        new UnprocessableEntityException(
          errors.map((e) => {
            const rule = Object.keys(e.constraints!)[0]
            const msg = e.constraints![rule]
            return msg
          })[0],
        ),
    }),
  )

  app.useWebSocketAdapter(new RedisIoAdapter(app))

  const printSwaggerLog = setupSwagger(app, configService)

  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService))
    const url = await app.getUrl()
    const { pid } = process
    const env = cluster.isPrimary
    const prefix = env ? 'P' : 'W'

    if (!isMainProcess)
      return

    printSwaggerLog?.()

    const logger = new Logger('NestApplication')
    logger.log(`[${prefix + pid}] Server running on ${url}`)
  })

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
