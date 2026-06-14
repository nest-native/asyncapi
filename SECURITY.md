# Security Policy

Thank you for helping keep `@nest-native/asyncapi` safe for NestJS event-driven
applications.

## Supported Versions

Security fixes target the current published package line.

| Package | Supported |
| --- | --- |
| `@nest-native/asyncapi` latest minor | Yes |
| Older unpublished branches | No |

## Reporting A Vulnerability

Please do not open a public issue for vulnerabilities or suspected secret
leakage.

Use GitHub's private vulnerability reporting for this repository when available:

<https://github.com/nest-native/asyncapi/security/advisories/new>

If private reporting is unavailable, contact the maintainer through the GitHub
profile and include only the minimum information needed to establish a private
channel. Do not send exploit details, credentials, API keys, broker URLs, or
customer data in public comments.

## What To Include

Private reports are most useful when they include:

- Affected package version or commit.
- NestJS, AsyncAPI spec target, and transport (Kafka/NATS/MQTT/AMQP) versions.
- The smallest reproduction or vulnerable code path.
- Expected impact, such as unauthenticated access to a docs route that exposes
  internal schemas, XSS in the rendered viewer content, secret leakage in
  generated example payloads, URL injection through `@AsyncApiServer`
  configuration, or dependency confusion.
- Whether the issue affects package code, samples, docs, CI, or release
  automation.

Please redact secrets, hostnames, tokens, API keys, broker URLs, and private
customer data.

## Project Security Boundaries

This package is a documentation layer that generates an AsyncAPI 3.0 spec from
NestJS metadata and serves it alongside a viewer. It is not a runtime transport.
Applications still own:

- Broker credentials, connection strings, and transport configuration.
- Authentication and authorization for the generated docs route.
- The contents of message payloads and example values.
- Validation choices such as class-validator or app-owned Zod schemas.

Security fixes in this repository focus on package behavior — especially that
the docs route respects the application's auth boundaries, that the rendered
viewer does not introduce XSS, that generated example payloads never leak
secrets, and that `@AsyncApiServer` configuration cannot be used for URL
injection — alongside samples, docs, release automation, and patterns that could
encourage unsafe usage.

## Disclosure

The maintainer will acknowledge valid private reports as soon as practical,
coordinate a fix when the issue is in scope, and publish release notes or an
advisory when public disclosure is appropriate.
