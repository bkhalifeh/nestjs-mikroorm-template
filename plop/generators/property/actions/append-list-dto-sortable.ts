import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { LIST_DTO_PATH, TEMPLATE_DIR } from '../constants';

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function appendListDtoSortable(
  _plop: NodePlopAPI,
): ActionType {
  return {
    type: 'modify',
    path: LIST_DTO_PATH,
    pattern: /^(?=\s*\/\/ \<\/sortable-fields\>)/m,
    templateFile: `${TEMPLATE_DIR}/list-dto-sortable.hbs`,
    skip: (answers: Record<string, any>) => {
      if (!answers.addSort) return 'append-list-dto-sortable - sort not requested';
      if (listDtoMissing(answers)) {
        return 'append-list-dto-sortable - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
