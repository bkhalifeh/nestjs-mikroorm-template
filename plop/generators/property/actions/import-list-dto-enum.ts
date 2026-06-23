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

export default function importListDtoEnum(_plop: NodePlopAPI): ActionType {
  return {
    type: 'addImport',
    data: {
      path: LIST_DTO_PATH,
      importName: '{{pascalCase enumName}}',
      from: (answers: Record<string, any>) => {
        return answers.enumPath === 'new enum'
          ? 'src/modules/{{kebabCase moduleName}}/enums/{{kebabCase enumName}}.enum.ts'
          : answers.enumPath;
      },
    },
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'import-list-dto-enum - filter not requested';
      if (answers.type !== 'enum') return 'import-list-dto-enum - not enum';
      if (listDtoMissing(answers)) {
        return 'import-list-dto-enum - list-dto.ts missing (legacy resource)';
      }
    },
  };
}
