import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

function serviceExists(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return existsSync(
    resolve(`src/modules/${module}/services/${entity}.service.ts`),
  );
}

export default function removeServiceFilter(_plop: NodePlopAPI): ActionType {
  return {
    type: 'removeBlock',
    data: {
      path: 'src/modules/{{kebabCase moduleName}}/services/{{kebabCase entityName}}.service.ts',
      tag: 'filter',
      name: '{{camelCase name}}',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.confirm) return 'remove-service-filter - aborted by user';
      if (!serviceExists(answers)) return 'remove-service-filter - service missing';
    },
  };
}
