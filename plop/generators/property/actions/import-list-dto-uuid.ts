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

export default function importListDtoUuid(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: 'IsUUID',
      from: 'class-validator',
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-uuid - filter not requested';
      if (answers.type !== 'relation') return 'import-list-dto-uuid - not relation';
      if (listDtoMissing(answers)) {
        return 'import-list-dto-uuid - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
