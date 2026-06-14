import { Module } from '@nestjs/common';
import { AsyncApiModule } from '@nest-native/asyncapi';
import { PaymentsModule } from './payments/payments.module';

/**
 * Root module for the class-validator validation sample.
 */
@Module({
  imports: [
    AsyncApiModule.forRoot({ defaultInfo: { title: 'Payments Service' } }),
    PaymentsModule,
  ],
})
export class AppModule {}
