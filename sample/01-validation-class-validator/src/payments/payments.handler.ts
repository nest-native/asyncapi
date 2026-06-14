import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiHeaders,
  AsyncApiMessage,
  AsyncApiPub,
} from '@nest-native/asyncapi';
import { PaymentCapturedDto, PaymentHeadersDto } from './payment.dto';

/**
 * A payments channel whose message payload and headers are class-validator DTOs.
 */
@Controller()
@AsyncApiChannel('payments', {
  address: 'payments.v1',
  title: 'Payments',
  description: 'Payment lifecycle events.',
})
export class PaymentsHandler {
  /**
   * The application publishes a `payment captured` event.
   */
  @AsyncApiPub({
    operationId: 'paymentCaptured',
    summary: 'A payment was captured.',
  })
  @AsyncApiMessage(PaymentCapturedDto, { name: 'PaymentCaptured' })
  @AsyncApiHeaders(PaymentHeadersDto)
  publishPaymentCaptured(): void {
    // Transport is out of scope; a real producer emits the event here.
  }
}
