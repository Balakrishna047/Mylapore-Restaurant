import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cors from 'cors';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Mylapore Express Enterprise API')
    .setDescription('Full REST and Event API contracts powering Mylapore Express culinary commerce, Agentforce AI, Stripe, and Salesforce')
    .setVersion('2.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-agentforce-api-key',
        in: 'header',
        description: 'Salesforce Agentforce Named Credential Secret Key'
      },
      'agentforce-key'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Serve raw OpenAPI JSON schema directly for Salesforce External Services schema import
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs-json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  const port = process.env.PORT || 10000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Mylapore Express API listening on http://0.0.0.0:${port}/api/v1`);
  console.log(`📑 OpenAPI Swagger documentation live on http://localhost:${port}/api/docs`);
}

bootstrap();
