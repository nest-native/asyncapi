import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'AsyncAPI 3.0 Native',
    icon: '3.0',
    description: (
      <>
        Built around the channels, operations, and messages model that AsyncAPI
        3.0 introduced — not a 2.x port. Every generated document is validated
        against the official @asyncapi/parser.
      </>
    ),
  },
  {
    title: 'Swagger Mental Model',
    icon: 'DX',
    description: (
      <>
        Decorate handlers and DTOs, then generate on boot. The same flow any
        Nest user already knows from documenting an HTTP API with
        @nestjs/swagger, applied to the event side.
      </>
    ),
  },
  {
    title: 'Five Decorators',
    icon: 'API',
    description: (
      <>
        @AsyncApiChannel, @AsyncApiPub / @AsyncApiSub, @AsyncApiMessage, and
        @AsyncApiHeaders map directly onto AsyncAPI primitives. @AsyncApiServer
        declares the brokers you connect to.
      </>
    ),
  },
  {
    title: 'Transport Bindings',
    icon: 'Bus',
    description: (
      <>
        Typed Kafka, NATS, MQTT, and AMQP bindings for servers, channels,
        operations, and messages, emitted verbatim onto the spec so transport
        identity stays explicit.
      </>
    ),
  },
  {
    title: 'Docs Route With Viewer',
    icon: 'Web',
    description: (
      <>
        AsyncApiModule.setup serves the viewer page plus raw JSON and YAML on
        your existing HTTP server. Adapter-agnostic across Express and Fastify.
      </>
    ),
  },
  {
    title: 'Zero Runtime Dependencies',
    icon: 'Zero',
    description: (
      <>
        The published package keeps runtime dependencies empty. Nest, the
        AsyncAPI parser, the viewer, and validation libraries stay under the
        host application's control as optional peers.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md feature-card">
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
