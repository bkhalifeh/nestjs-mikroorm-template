import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { DATE_TYPES, LIST_DTO_PATH, NUMBER_TYPES } from '../constants';

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function importListDtoType(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: 'Type',
      from: 'class-transformer',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-type - filter not requested';
      if (
        !NUMBER_TYPES.includes(answers.type) &&
        !DATE_TYPES.includes(answers.type)
      ) {
        return 'import-list-dto-type - not number/date type';
      }
      if (listDtoMissing(answers)) {
        return 'import-list-dto-type - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
