import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/docs' || req.path.startsWith('/docs/') || req.path === '/docs-json') {
      // Swagger UI serves an embedded OpenAPI snapshot via /docs/swagger-ui-init.js.
      // Disabling cache on all docs assets avoids stale UI while /docs-json is already fresh.
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    next();
  });

  const config = new DocumentBuilder()
    .setTitle('StockPilot API')
    .setDescription(
      'API REST de gestion de stock, ventes, commandes et authentification. Documentation interactive Swagger pour integration web/mobile.',
    )
    .setVersion('1.0.0')
    .addServer('/', 'Current origin')
    .addServer('http://localhost:4000', 'Local development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Use accessToken only. Do not use refreshToken for protected endpoints.',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'StockPilot API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
