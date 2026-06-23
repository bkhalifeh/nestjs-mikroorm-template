import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

function listDtoExists(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return existsSync(resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`));
}

export default function removeListDtoSortable(_plop: NodePlopAPI): ActionType {
  return {
    type: 'removeBlock',
    data: {
      path: 'src/modules/{{kebabCase moduleName}}/dto/list-{{kebabCase entityName}}.dto.ts',
      tag: 'sortable-field',
      name: '{{camelCase name}}',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.confirm) return 'remove-list-dto-sortable - aborted by user';
      if (!listDtoExists(answers)) return 'remove-list-dto-sortable - list-dto missing';
    },
  };
}
