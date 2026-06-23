import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { SERVICE_PATH, STRING_TYPES, TEMPLATE_DIR } from '../constants';

function serviceMissingFiltersMarker(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  const path = resolve(
    `src/modules/${module}/services/${entity}.service.ts`,
  );
  if (!existsSync(path)) return true;
  return !readFileSync(path, 'utf8').includes('// </filters>');
}

export default function appendServiceFilter(_plop: NodePlopAPI): ActionType {
  return {
    type: 'modify',
    path: SERVICE_PATH,
    pattern: /^(?=\s*\/\/ \<\/filters\>)/m,
    templateFile: `${TEMPLATE_DIR}/service-filter.hbs`,
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'append-service-filter - filter not requested';
      if (STRING_TYPES.includes(answers.type)) {
        return 'append-service-filter - string types use search instead';
      }
      if (serviceMissingFiltersMarker(answers)) {
        return 'append-service-filter - service has no <filters> marker (legacy resource)';
      }
    },
  };
}
