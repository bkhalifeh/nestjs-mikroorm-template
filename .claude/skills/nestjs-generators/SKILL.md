---
name: nestjs-generators
description: Scaffold or remove NestJS code in this template using the Plop generators. Use whenever the user wants to "add a module/controller/service/route/guard/middleware/pipe/provider", "create a DTO or entity/resource", "add a property/field", "add a config option or env var", "inject a dependency", "rename a module/service", or "remove/delete" any of those. Use it instead of hand-writing structural code, because the generators also wire up DI, module imports, barrels, and .env. Also use when a hand-edit broke the marker comments and follow-up generators fail.
---

# NestJS MikroORM Template — Generators

This template is edited through **Plop** generators, not by hand. They create files *and* splice the code into every reference site (module `imports` arrays, constructor DI, barrel imports, `.env` / `.env.example`). The `rm-*` counterparts unwind all of it. Hand-editing structural code drifts from this and breaks the `rm-*` / follow-up generators.

## Run generators headless (no prompts)

Use the **`plop:run`** script with bypass flags — this skips the inquirer prompts, so you can run it from a normal `Bash` call:

```bash
npm run plop:run -- <generator> --<prompt> <value> [--<prompt> <value> ...]
```

- Each flag name is the generator's prompt key (table below). Quote values with spaces.
- **Boolean/confirm prompts must be passed explicitly** as `--flag true` / `--flag false`. If a confirm prompt is omitted, the run drops into interactive mode and **errors with `ERR_USE_AFTER_CLOSE`** (no TTY). This is the #1 failure — always pass every confirm flag.

Examples (verified):
```bash
npm run plop:run -- module --name "billing"
npm run plop:run -- resource --name "invoice" --genCRUD true --enablePagination true
npm run plop:run -- rm-module --name "billing" --confirm true
```

Do NOT use `npm run plop` (the interactive menu in `plop/menu.ts`) — it always prompts and will hang in a non-interactive shell. Menu is for humans.

## Workflow

1. **Pick the generator** from the catalog by what's being added/removed.
2. **Build the command** with every required flag, including all confirm flags.
3. **Run** via `npm run plop:run -- …`. Read the `✔` / `✖` receipt it prints per file.
4. **Verify**:
   ```bash
   npm run build      # SWC build + type-check catches mis-wiring
   npm run lint
   npm test           # if a spec is affected
   ```
5. If markers were mangled by a prior hand-edit, restore them (see Markers) before re-running any generator.

## Generator catalog + flags

Flag = the prompt's key. `*` = confirm/boolean (pass `--flag true|false` explicitly).

| Generator | Flags | Notes |
|---|---|---|
| `module` | `name` | registers in root AppModule |
| `rm-module` | `name`, `confirm`* | unwinds imports/deps + deletes dir |
| `resource` | `name`, `genCRUD`*, `enablePagination`* | domain+entity (+CRUD ctrl/service/dto when `genCRUD true`); `enablePagination` only applies when `genCRUD true` |
| `property` / `rm-property` | many (see below) | field on a resource's domain+entity |
| `controller` / `rm-controller` | `name`, `moduleName` | |
| `route` / `rm-route` | `name`, `moduleName`, `controllerName`, `method`, `path` | `method` = HTTP verb |
| `service` / `rm-service` | `name`, `moduleName`, `export`* | |
| `provider` / `rm-provider` | `name`, `moduleName`, `export`* | |
| `guard` / `middleware` / `pipe` (+ `rm-`) | `name`, `moduleName`, `export`* | |
| `function` / `rm-function` | `name`, `moduleName`, `target`, `targetName` | adds a method into `// <functions>`; `target` = service/provider/guard/middleware/pipe |
| `dto` / `rm-dto` | `name`, `moduleName`, `usedIn`, `argType`, + (`controllerName`/`routeName` or `serviceName`/`providerName`/`functionName`) | wired to where it's `usedIn` |
| `dto-property` / `rm-dto-property` | `dtoName`, `moduleName`, `type`, `addValidator`* | |
| `config` / `rm-config` | `name` | new validated env namespace + `.env`/`.env.example` block |
| `config-property` / `rm-config-property` | `resourceName`, `name`, `type`, `defaultValue`, `enumName`, `enumPath`, `urlProtocols` | enum/url flags only for those types |
| `dependency` | `target`, `targetName`, `moduleName`, `depKind`, `depName`, `depModuleName`, `propertyName` | inject existing provider/module into target |
| `rename` | `kind`, `moduleName`, `name`, `newName`, `confirm`* | rename + update references |

### `property` (rich) flags

Core: `name`, `type`, `nullable`*, `unique`*, `length`, `default`, `hidden`*, `swagger`*, `entityName`, `moduleName`.
Validators: `addValidator`*, `minLength`, `maxLength`, `minNumber`, `maxNumber`, `minItems`, `maxItems`, `array`*, `format`, `formatOption`, `swaggerExample`.
Enum: `enumName`, `enumPath`, `uuidVersion`.
Relations: `relationKind`, `relationOwner`, `targetEntity`, `targetEntityPath`, `mappedBy`, `inversedBy`, `lazy`*, `skipDb`*, `addCreate`*, `addFilter`*, `addSort`*.
Pass only the flags relevant to the chosen `type`. For an unfamiliar field, run the generator interactively once via `npm run plop -- property` (ask the user to run it) to see which prompts fire, then script it.

## Markers — never delete or reformat

Generators find insertion points via XML-style marker comments. Edit code *between* markers; keep markers intact or `rm-*` and follow-up `add` runs fail.

```ts
// <imports>
// <import name="UserService"> … // </import>
// </imports>

// <properties>            // constructor DI
// <property name="userService"> … // </property>
// </properties>

// <functions>             // service methods
// <function name="create"> … // </function>
// </functions>

// <dependencies>          // module imports array
// <dependency name="UserModule"> … // </dependency>
// </dependencies>
```

`.env` / `.env.example` use the same convention: `# <resource name="…">`, `# <property name="…">`. When adding config by hand, mirror it exactly so generators stay in sync.

## When to hand-edit vs generate

- **Generate** anything structural: new module/service/controller/route/guard/pipe/dto/config/entity field, dependency injection, or removing any of these.
- **Hand-edit** only the *body* of a generated block — method logic, validation rules, query building — leaving markers and signatures intact.
