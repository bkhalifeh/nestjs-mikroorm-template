# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev        # dev server, watch mode
npm run build            # nest build via SWC, with type-check (nest-cli.json)
npm run start:prod       # node dist/main (loads compiled entities)
npm run repl             # NestJS REPL (entryFile repl.ts)

npm run lint             # eslint --fix over {src,test}/**/*.ts
npm run format           # prettier --write
npm run format-lint      # format then lint

npm test                 # vitest run (unit, *.spec.ts beside source)
npm run test:watch
npm run test:cov
npm run test:e2e         # vitest with vitest.config.e2e.ts (test/**/*.e2e-spec.ts)

# Single test:
npx vitest run src/modules/health/health.service.spec.ts
npx vitest run -t "substring of test name"

# MikroORM CLI (config: src/mikro-orm.config.ts, preferTs + swc loader):
npx mikro-orm migration:create
npx mikro-orm migration:up
```

Migrations live in `src/modules/orm/migrations` (TS) / `dist/.../migrations` (prod).

## Code scaffolding (plop) — read before hand-editing modules

This is a **code-generator template**. Most module/controller/service/dto/config code is created and removed by plop generators, not by hand.

```bash
npm run plop                 # interactive menu (plop/menu.ts): pick Add/Remove/Refactor → generator
npm run plop -- <generator>  # run a generator directly, e.g. `service`, `rm-service`, `config-property`
```

Generators (`plop/generators/`) cover: module, resource, controller, route, service, provider, guard, middleware, pipe, function, dto, dto-property, property, dependency, config, config-property, rename — each with an `rm-*` counterpart.

**Critical: marker comments are generator anchors. Do not delete or reformat them.** Files are peppered with XML-style markers that plop's custom action-types (`plop/action-types/`, e.g. `add-block-import`, `remove-block-with-cleanup`, `cascade-injection`) target for insert/remove:

```ts
// <imports>
// <import name="UserService"> ... // </import>
// </imports>
// <properties> / <property name="..."> ...    (constructor DI)
// <functions> / <function name="..."> ...      (service methods)
// <dependencies> / <dependency name="...">      (module imports array)
```

`.env.example` uses the same markers (`# <resource name="...">`, `# <property name="...">`). When adding config by hand, mirror this structure so generators stay consistent.

## Architecture

NestJS 11 + MikroORM 7 (PostgreSQL) + Express. ESM-style `module: NodeNext`, target es2024, strict TS (incl. `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).

**Bootstrap two-phase config** (`src/main.ts` → `src/modules/config/helper.ts`): `getInitConfig()` spins up a throwaway `BootstrapConfigModule` app context to read app/node/swagger config *before* the main app is created (needed for versioning, global prefix, Swagger, listen host/port). Then the real `AppModule` boots.

**Config system** (`src/modules/config/resources/*-resource.ts`): each config is a class with `class-transformer` (`@Expose({ name: 'NS__VAR' })`, `@Transform` for defaults) + `class-validator` decorators, registered via `createValidatedConfig(token, Class)` (`src/common/helper/functions.ts`). That helper does `plainToInstance(process.env)` + `validateSync` and **throws on invalid/missing env at startup**. Env var convention: `NAMESPACE__PROPERTY` (double underscore). Inject configs by `PROVIDER.KEY` token; types come from `ConfigType<typeof PROVIDER>`.

**Entity / domain split** (see `src/modules/user/`):
- `domains/<name>.ts` — plain class extending `Base` (`src/modules/orm/base.entity.ts`), decorated with the **custom** `@ApiProperty` (`src/common/decorators/api-property.decorator.ts`, not Nest's) for Swagger + optional validators. This is the runtime/serialization shape.
- `entities/<name>.entity.ts` — MikroORM **functional** definition via `defineEntity({ class, extends: BaseEntity, properties: { x: p.string()... }, repository })`. Uses the `p` builder, not decorators. `serializedName` maps camelCase ↔ snake_case columns.
- `repositories/<name>.repository.ts` — `extends EntityRepository<Domain>`.
- `services/`, `controllers/`, `dto/`, `responses/`, `enums/` round out a module.

`Base` provides `id` (uuid v7 via `p.uuid().onCreate`), `createdAt`, `updatedAt`. Services use injected `EntityManager` + repositories; flush is explicit (`em.flush()`).

**Cross-cutting modules** (wired in `src/modules/app/app.module.ts`): pino logging (`nestjs-pino`), request context (`nestjs-cls`, e.g. `requestId`), i18n (`nestjs-i18n`, generated types in `src/modules/i18n/i18n.generated.ts`), BullMQ, Redis, S3 (`nestjs-s3`), serve-static (`STATIC_DIRECTORY` = `static/`), Terminus health. Strategy-pattern infra modules expose an interface + swappable strategies + an inject decorator: `hash` (argon2), `mailer` (smtp/log), `sms` (twilio/log), `file-type`.

**Global pipeline** (`main.ts`): `ValidationPipe` (whitelist + forbidNonWhitelisted + transform, stopAtFirstError) and `ClassSerializerInterceptor` are global. Helmet, CORS, URI versioning (`v<major>`), and global prefix (`api`) are toggled by config.

## Notes

- README.md is empty; `.env` / `.env.example` are the source of truth for runtime config.
- `@typescript-eslint/no-floating-promises` and `no-unsafe-argument` are **warnings**; `no-explicit-any` is off.
- Lots of intentionally-commented code in `main.ts` / config files marks optional features (sessions, CSRF, SSL, caching) — leave unless implementing.
