import { Controller } from '@nestjs/common';
import {
  AsyncApiChannel,
  AsyncApiMessage,
  AsyncApiPub,
} from '@nest-native/asyncapi';
import { metricReportedMessage } from './metric.schema';

/**
 * A metrics channel whose message payload is a Zod schema converted to JSON
 * Schema. Proves the generator is agnostic to the validation library.
 */
@Controller()
@AsyncApiChannel('metrics', {
  address: 'metrics.v1',
  title: 'Metrics',
  description: 'Application metric events.',
})
export class MetricsHandler {
  /**
   * The application publishes a `metric reported` event.
   */
  @AsyncApiPub({
    operationId: 'metricReported',
    summary: 'A metric was reported.',
  })
  @AsyncApiMessage(metricReportedMessage, {
    summary: 'A single metric sample.',
  })
  publishMetricReported(): void {
    // Transport is out of scope; a real producer emits the event here.
  }
}
