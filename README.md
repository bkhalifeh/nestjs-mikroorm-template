# NestJS + MikroORM Template

An opinionated NestJS 11 starter wired for production, with a **code-generator toolkit** that scaffolds and removes modules, controllers, services, DTOs, routes, and config — keeping every wiring point (DI, imports, module arrays, `.env`) consistent for you.

## Stack

- **NestJS 11** on Express, URI versioning, global prefix
- **MikroORM 7** (PostgreSQL) with functional entity definitions (`defineEntity` / `p`)
- **Config** validated at startup via `class-validator` + `class-transformer` (`NS__VAR` env convention)
- **Cross-cutting**: pino logging (`nestjs-pino`), request context (`nestjs-cls`), i18n (`nestjs-i18n`), BullMQ, Redis, S3, serve-static, Terminus health
- **Swappable strategy modules**: hashing (argon2), mailer (smtp/log), sms (twilio/log), file-type
- **Auth**: passport (local, JWT, Google, GitHub OAuth)
- **Tooling**: SWC build, Vitest, ESLint flat config, Prettier, Plop generators

## Getting started

```bash
npm install
cp .env.example .env          # then fill in values
# start PostgreSQL + Redis (see your .env for hosts/ports)

npx mikro-orm migration:up    # apply migrations
npm run start:dev             # http://localhost:3000
```

On boot the app validates every env var declared in the config resources and **throws if any are missing or invalid** — `.env.example` is the authoritative list.

Once running:
- API: `http://localhost:3000/api` (global prefix, versioned `…/v1/…`)
- Swagger: `http://localhost:3000/<SWAGGER__PATH>`
- Static: `http://localhost:3000/static`

## Scripts

```bash
npm run start:dev        # watch mode
npm run build            # nest build (SWC + type-check)
npm run start:prod       # node dist/main
npm run repl             # NestJS REPL

npm run lint             # eslint --fix
npm run format           # prettier --write
npm run format-lint      # format then lint

npm test                 # unit tests (Vitest)
npm run test:watch
npm run test:cov
npm run test:e2e         # test/**/*.e2e-spec.ts

npm run plop             # code generator (see below)

# MikroORM CLI (config: src/mikro-orm.config.ts):
npx mikro-orm migration:create
npx mikro-orm migration:up
```

Run a single test:

```bash
npx vitest run src/modules/health/health.service.spec.ts
npx vitest run -t "creates a user"
```

## Project layout

```
src/
  main.ts                  # bootstrap (two-phase config, helmet, pipes, swagger)
  mikro-orm.config.ts      # CLI datasource config
  common/                  # decorators, validators, enums, dto, helpers, responses
  modules/
    app/                   # root module (aggregates all imports)
    config/                # config resources (one class per namespace)
    <feature>/             # domains, entities, repositories, services,
                           #   controllers, dto, responses, enums
plop/                      # generator engine (menu, generators, action-types)
i18n/                      # translation catalogs
test/                      # e2e specs
```

A feature module (see `src/modules/user/`) separates:
- **`domains/<name>.ts`** — plain class extending `Base`, decorated with the custom `@ApiProperty` (Swagger + validators). Runtime/serialization shape.
- **`entities/<name>.entity.ts`** — MikroORM `defineEntity({ class, extends: BaseEntity, properties: { x: p.string()… }, repository })`. The `p` builder, `serializedName` maps camelCase ↔ snake_case columns.
- **`repositories/`, `services/`, `controllers/`, `dto/`, `responses/`, `enums/`**.

## Working with the generator

The whole template is built to be edited through **Plop** generators rather than by hand. They create files *and* splice the new code into every place it must be referenced — module `imports` arrays, constructor DI, barrel imports, `.env` / `.env.example` — and the `rm-*` counterparts unwind all of it cleanly.

### Run it

```bash
npm run plop                 # interactive menu
npm run plop -- <generator>  # run one generator directly, e.g. `npm run plop -- service`
```

The interactive menu (`plop/menu.ts`) walks you through:

1. **Action** — Add / Remove / Refactor
2. **Domain group** — Module · HTTP layer · Business logic · Data · Configuration · Refactor
3. **Generator** — then answer its prompts (names, types, target module, etc.)

Each run prints a receipt of every file added/modified (`✔`) or failed (`✖`).

### Generator catalog

| Group | Add | Remove |
|---|---|---|
| **Module** | `module`, `resource`, `dependency` | `rm-module` |
| **HTTP layer** | `controller`, `route`, `guard`, `middleware`, `pipe` | `rm-controller`, `rm-route`, `rm-guard`, `rm-middleware`, `rm-pipe` |
| **Business logic** | `service`, `provider`, `function` | `rm-service`, `rm-provider`, `rm-function` |
| **Data** | `dto`, `dto-property`, `property` | `rm-dto`, `rm-dto-property`, `rm-property` |
| **Configuration** | `config`, `config-property` | `rm-config`, `rm-config-property` |
| **Refactor** | `rename` (module / controller / service / provider) | — |

What they do:

- **`module`** — new feature module, registered in the root `AppModule`.
- **`resource`** / **`property`** — a domain + entity pair and its fields (the `domains`/`entities` split above), with Swagger + ORM column metadata.
- **`controller` / `route`** — controller and route handlers wired into a module.
- **`service` / `provider` / `function`** — providers and their methods, injected where requested.
- **`guard` / `middleware` / `pipe`** — NestJS enhancers.
- **`dto` / `dto-property`** — request DTOs with `class-validator` decorators.
- **`config` / `config-property`** — a validated config namespace (resource class + provider token) plus matching `.env` / `.env.example` entries.
- **`dependency`** — inject an existing provider/module into a module, controller, service, or provider (constructor + imports updated).
- **`rename`** — rename a symbol and update its references.

### Marker comments — do not delete

Generators locate insertion points using **XML-style marker comments**. Edit code *between* the markers, but never remove or reformat the markers themselves, or `rm-*` and follow-up `add` generators will fail.

```ts
// <imports>
// <import name="UserService"> … // </import>
// </imports>

// <properties>
// <property name="userService"> …    // constructor DI
// </properties>

// <functions>
// <function name="create"> …          // service methods
// </functions>

// <dependencies>
// <dependency name="UserModule"> …    // module imports array
// </dependencies>
```

`.env` / `.env.example` use the same convention (`# <resource name="…">`, `# <property name="…">`). When adding config by hand, mirror this structure so the generators stay in sync.

### When to hand-edit vs. generate

Prefer a generator for anything structural (new module/service/route/config, or removing one) — it keeps DI and registration correct. Hand-edit only the *body* of generated blocks (method logic, validation rules, query building).

## License

MIT
