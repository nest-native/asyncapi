# nest-asyncapi-native — Implementation Brief

> Single source of truth for implementing `nest-native/nest-asyncapi-native`.
> Read this end-to-end before writing code. It is written for a fresh
> session that has no other context.

**Project type:** New package.
**Repository:** https://github.com/nest-native/nest-asyncapi-native
**Org:** https://github.com/nest-native

---

## 1. Read these first

This package's constitution is `.briefing/AI_CODING_GUIDELINES.md` at the repo
root. Read it end-to-end before writing code. It is the SOLE governing
document for this package — no other guideline files apply.

This brief specifies WHAT to build and ON WHAT SCHEDULE. The constitution
specifies HOW. If they conflict on a general nest-native principle,
**the constitution wins**.

If you discover an inconsistency between this brief and the constitution,
or between either and the implementation reality (e.g., the AsyncAPI 3.0
parser surface differs from what we assumed), you may update the
constitution as part of your PR:

- Update in a focused commit on the current branch (alongside the code
  that exposed the inconsistency).
- The PR body MUST include a "Guideline Updates" section quoting the
  before/after of every changed section.
- Do not weaken the Security, Release Sync, or Cognitive Complexity
  sections without explicit operator instruction here in the brief.
- Do not delete sections; rewrite or add a "Superseded" note.
- If a change would require revisiting a previously-merged milestone,
  STOP and flag — do not silently invalidate prior work.

## 2. Mission

A decorator-first AsyncAPI 3.0 documentation generator for NestJS
event-driven services. Mirror the DX of `@nestjs/swagger` (for HTTP) but
for the event/message side: `@nestjs/microservices` handlers, Kafka, NATS,
MQTT, AMQP, and WebSocket gateways.

Output is a generated `asyncapi.json` / `asyncapi.yaml` conforming to
AsyncAPI 3.0, served at a configurable route alongside an AsyncAPI viewer.

## 3. Community pain (the gap)

`nestjs-asyncapi` is the de-facto generator and is effectively abandoned:

- AsyncAPI 3.0 support requested Dec 2023, no progress (`#518`).
- Breaks on Node 24 and current `@nestjs/swagger` (`#596`).
- Outdated peer-dep security warnings (`#585`).
- Users openly asking "is this maintained?" (`#578`).

~39k monthly downloads confirms demand. There is no `@nestjs/asyncapi` to
replace it. Textbook "abandoned community package, no official
alternative" gap.

Evidence:
- https://github.com/flamewow/nestjs-asyncapi/issues/518
- https://github.com/flamewow/nestjs-asyncapi/issues/578
- https://github.com/flamewow/nestjs-asyncapi/issues/596
- https://github.com/flamewow/nestjs-asyncapi/issues/585

## 4. Non-goals

- **A runtime transport.** This is documentation only. Use
  `@nestjs/microservices` or `nest-kafka-native` for transport.
- **AsyncAPI 2.x beyond best-effort conversion.** v1 is 3.0 native.
- **Code generation from spec.** Spec → handlers is out of scope.
- **Bundled mocking / test broker.** Maybe a companion package later.

## 5. Tech stack and versions

| Item | Choice |
| --- | --- |
| Node | `>=20` |
| NestJS | `11.x` |
| TypeScript | `^6` |
| AsyncAPI spec target | 3.0 |
| Viewer | `@asyncapi/react-component` for the docs route |
| Validation source | Zod (via `zod-to-json-schema`) and class-validator metadata, mirroring `@nestjs/swagger`'s dual posture |
| Test runner | `node:test` + `c8` |
| Lint | ESLint 10 + SonarJS, complexity 15 |
| Package manager | `npm@11` |

Published package keeps `"dependencies": {}`. The viewer assets ship
bundled only if reasonably small; otherwise via `peerDependencies` with
documented install steps.

## 6. Repo layout

Mirror the existing nest-native package layout exactly. Use
`nest-native/nest-trpc-native` as the concrete template.

## 7. Public API surface (proposed — confirm via samples first)

Module:
- `AsyncApiModule.forRoot(options)` / `forRootAsync(options)` — registers
  the generator + docs route.

Decorators (mirror `@nestjs/swagger` naming where possible):
- `@AsyncApiChannel('channel-id', options)` — class-level on a handler
- `@AsyncApiPub({...})` / `@AsyncApiSub({...})` — method-level
- `@AsyncApiMessage(MessageDto)` — payload metadata
- `@AsyncApiHeaders(HeadersDto)` — headers metadata
- `@AsyncApiServer(name, options)` — server declaration

Function-level helpers:
- `getAsyncApiDocument(app, config)` — analogous to
  `SwaggerModule.createDocument`.

Discovery must use NestJS metadata reflection exactly as `@nestjs/swagger`
does for `@Controller`.

## 8. v1 scope discipline

**Ships:** AsyncAPI 3.0 spec generation from decorated handlers; hosted
docs route with the viewer; bindings for Kafka, NATS, MQTT, AMQP
(transport identifiers and connection metadata at minimum); integration
with `@nestjs/microservices` handlers (`@MessagePattern`, `@EventPattern`);
optional integration with `nest-kafka-native` if that ships first; DTO ↔
JSON Schema generation via the same path `@nestjs/swagger` uses.

**Does NOT ship:** AsyncAPI 2.x (best-effort or none), spec-driven
scaffolding, mock broker / contract testing, OpenAPI → AsyncAPI conversion.

## 9. Design questions to settle in v1

1. **Channel-id discovery.** Auto-derive from class name vs require
   explicit. Default explicit.
2. **Transport binding inference.** When a handler uses `@MessagePattern`
   without explicit AsyncAPI metadata, can the binding be inferred? How
   far does inference go before it becomes magic?
3. **Spec output format.** YAML default, JSON optional, or vice versa.
   Match prevailing AsyncAPI tooling convention.
4. **Viewer asset distribution.** Bundled vs CDN vs peer-installed.
5. **Versioning.** Document version vs spec version vs server version —
   how they relate in generated output.

## 10. Quality gates

Same as the existing two packages. See `.briefing/AI_CODING_GUIDELINES.md` §9–§11.

## 11. Milestones

1. **Bootstrap.** Repo skeleton, empty package, CI green. Tag
   `v0.0.1-scaffold`. (`.briefing/AI_CODING_GUIDELINES.md` is already at the repo
   root from the initial commit; no need to create it.)
2. Spec generator skeleton: walks NestJS metadata, emits an empty valid
   3.0 doc.
3. `@AsyncApiChannel` + `@AsyncApiPub` / `@AsyncApiSub`. Generator emits a
   valid 3.0 spec with one handler in the showcase sample.
4. DTO ↔ JSON Schema integration. Validate output against the official
   `@asyncapi/parser`.
5. Transport bindings for Kafka, NATS, MQTT, AMQP.
6. Docs route with viewer.
7. Migration guide from `nestjs-asyncapi`, validated by porting one of
   their sample apps.
8. Documentation site (Docusaurus, mirror existing). Release v0.1.

## 12. First-session checklist

1. Read `.briefing/AI_CODING_GUIDELINES.md` in full (the constitution).
2. Read this brief end-to-end.
3. Skim the AsyncAPI 3.0 spec
   (https://www.asyncapi.com/docs/reference/specification/v3.0.0) —
   understand the channels/operations/messages separation that 3.0
   introduced.
4. Inspect `nestjs-asyncapi` source for what they got right and what broke
   — but do not import any of it.
5. Use `nest-native/nest-trpc-native` as the concrete template.
6. Bootstrap commit. Push. CI green.
7. Stop at `v0.0.1-scaffold` and hand back.

## 13. Definition of done for v1

- Generator produces a spec that passes official `@asyncapi/parser`
  validation.
- Docs route renders correctly with the AsyncAPI viewer.
- Migration guide validated by porting one real `nestjs-asyncapi` sample.
- `npm run ci` green on Node 20 and 22.
- Bindings for at least Kafka, NATS, MQTT, AMQP.

## 14. Honest risks

- **AsyncAPI 3.0 spec depth.** 3.0 is substantially more expressive than
  2.x. Implementing the full reference is large; scope tightly.
- **Viewer asset weight.** The viewer is a React app. Bundling vs CDN is
  a real tradeoff for non-React Nest apps.
- **Binding scope creep.** Every messaging tech has its own binding. Pick
  four for v1; defer others.
- **Prior-art comparison.** Users will compare to `nestjs-asyncapi` 2.x
  ergonomics. Be explicit about 3.0 differences in migration docs.

## 15. References

- AsyncAPI 3.0 spec:
  https://www.asyncapi.com/docs/reference/specification/v3.0.0
- This project's constitution: `.briefing/AI_CODING_GUIDELINES.md`.
- Existing nest-native packages as concrete templates:
  - https://github.com/nest-native/nest-drizzle-native
  - https://github.com/nest-native/nest-trpc-native
