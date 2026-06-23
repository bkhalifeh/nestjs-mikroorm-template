import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { LIST_DTO_PATH, STRING_TYPES, TEMPLATE_DIR } from '../constants';

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function appendListDtoProperty(
  _plop: NodePlopAPI,
): ActionType {
  return {
    type: 'modify',
    path: LIST_DTO_PATH,
    pattern: /^(?=\s*\/\/ \<\/properties\>)/m,
    templateFile: `${TEMPLATE_DIR}/list-dto-property.hbs`,
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'append-list-dto-property - filter not requested';
      if (STRING_TYPES.includes(answers.type)) {
        return 'append-list-dto-property - string types use search instead';
      }
      if (listDtoMissing(answers)) {
        return 'append-list-dto-property - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
