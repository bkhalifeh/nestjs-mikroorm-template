import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { LIST_DTO_PATH } from '../constants';

function listDtoMissing(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  return !existsSync(
    resolve(`src/modules/${module}/dto/list-${entity}.dto.ts`),
  );
}

export default function importListDtoArray(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: 'IsArray',
      from: 'class-validator',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-array - filter not requested';
      if (answers.type !== 'enum' && answers.type !== 'relation') {
        return 'import-list-dto-array - not enum or relation';
      }
      if (listDtoMissing(answers)) {
        return 'import-list-dto-array - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
