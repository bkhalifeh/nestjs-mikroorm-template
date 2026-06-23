import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { LIST_DTO_PATH, NUMBER_TYPES } from '../constants';

const INTEGER_TYPES = ['integer', 'smallint', 'bigint'];

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function importListDtoNumber(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: 'IsNumber',
      from: 'class-validator',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-number - filter not requested';
      if (!NUMBER_TYPES.includes(answers.type)) {
        return 'import-list-dto-number - not number type';
      }
      if (INTEGER_TYPES.includes(answers.type)) {
        return 'import-list-dto-number - integer uses IsInt';
      }
      if (listDtoMissing(answers)) {
        return 'import-list-dto-number - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
