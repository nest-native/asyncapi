# Roadmap

The package stays intentionally small and scoped to AsyncAPI 3.0 documentation.
The initial `0.x` release covers:

- `AsyncApiModule` registration, including async options and the docs route.
- The five decorators (`@AsyncApiChannel`, `@AsyncApiPub` / `@AsyncApiSub`,
  `@AsyncApiMessage`, `@AsyncApiHeaders`, `@AsyncApiServer`) and the three
  binding decorators.
- `getAsyncApiDocument()` metadata discovery, mirroring
  `SwaggerModule.createDocument`.
- Transport bindings for Kafka, NATS, MQTT, and AMQP.
- DTO and Zod schema generation through the `@nestjs/swagger` chain.
- A hosted docs route with the AsyncAPI viewer.
- A validated migration path from `nestjs-asyncapi`.
- Quality gates for coverage, performance reporting, cognitive complexity,
  release checks, and security audits.

## Boundaries

This package is documentation only. It is not a runtime transport — transport
stays in `@nestjs/microservices` or a broker integration such as
`@nest-native/kafka`.

The current scope deliberately does **not** ship:

- Full AsyncAPI 2.x support (best-effort conversion or none).
- Spec-driven scaffolding (spec to code).
- A mock broker or contract testing.
- OpenAPI to AsyncAPI conversion.

DTO classes documented through `@nestjs/swagger` are the canonical schema path.
Zod via `zod-to-json-schema` is supported as an optional, application-owned
choice and does not become a required dependency or the default documentation
path. The package never introduces a parallel schema reflector.

## Next

- Add focused samples for new public features as they land, keeping every
  generated document validated by `@asyncapi/parser`.
- Consider additional protocol bindings only when real usage shows demand, while
  keeping the typed binding models faithful to the AsyncAPI binding specs.
- Consider tiny optional helpers only when repeated samples show clear
  application friction and the helper does not weaken the Nest-native API or the
  AsyncAPI semantics.
