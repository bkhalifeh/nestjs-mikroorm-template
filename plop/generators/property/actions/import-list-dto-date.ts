import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { DATE_TYPES, LIST_DTO_PATH } from '../constants';

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function importListDtoDate(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: 'IsDate',
      from: 'class-validator',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-date - filter not requested';
      if (!DATE_TYPES.includes(answers.type)) {
        return 'import-list-dto-date - not date type';
      }
      if (listDtoMissing(answers)) {
        return 'import-list-dto-date - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
