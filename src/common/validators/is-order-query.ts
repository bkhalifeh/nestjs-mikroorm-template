import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { camelCase, snakeCase } from 'change-case';

import { SortOrder } from '../enums/sort-order.enum';

export type OrderQuery = Record<string, SortOrder>;

function normalizeOrder(
  raw: unknown,
  allowedFields: readonly string[],
): OrderQuery | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined;

  const allowed = new Set(allowedFields);
  const out: OrderQuery = {};

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const field = camelCase(key);
    if (!allowed.has(field)) continue;
    if (typeof value !== 'string') continue;
    const dir = value.toUpperCase();
    if (dir === (SortOrder.ASC as string)) {
      out[field] = SortOrder.ASC;
    } else if (dir === (SortOrder.DESC as string)) {
      out[field] = SortOrder.DESC;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function TransformOrderQuery(
  allowedFields: readonly string[],
): PropertyDecorator {
  return Transform(({ value }) => normalizeOrder(value, allowedFields));
}

export function IsOrderQuery(
  allowedFields: readonly string[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return applyDecorators(
    TransformOrderQuery(allowedFields),
    (target: object, propertyKey: string | symbol) => {
      registerDecorator({
        name: 'isOrderQuery',
        target: target.constructor,
        propertyName: propertyKey as string,
        constraints: [allowedFields],
        ...(validationOptions ? { options: validationOptions } : {}),
        validator: {
          validate(value: unknown): boolean {
            if (value === undefined) return true;
            if (typeof value !== 'object' || value === null) return false;
            if (Array.isArray(value)) return false;
            const allowed = new Set(allowedFields);
            for (const [key, dir] of Object.entries(
              value as Record<string, unknown>,
            )) {
              if (!allowed.has(key)) return false;
              if (
                dir !== (SortOrder.ASC as string) &&
                dir !== (SortOrder.DESC as string)
              ) {
                return false;
              }
            }
            return true;
          },
          defaultMessage(args: ValidationArguments): string {
            const allowed = (args.constraints[0] as string[])
              .map((f) => snakeCase(f))
              .join(', ');
            return `${args.property} must be an object whose keys are one of [${allowed}] and values are 'ASC' or 'DESC'`;
          },
        },
      });
    },
  );
}
