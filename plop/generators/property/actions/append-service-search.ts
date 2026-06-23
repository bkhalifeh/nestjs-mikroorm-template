import type { ActionType, NodePlopAPI } from 'plop';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { kebabCase } from 'change-case';

import { SERVICE_PATH, STRING_TYPES, TEMPLATE_DIR } from '../constants';

function serviceMissingSearchMarker(answers: Record<string, any>): boolean {
  const module = kebabCase(answers.moduleName ?? '');
  const entity = kebabCase(answers.entityName ?? '');
  const path = resolve(
    `src/modules/${module}/services/${entity}.service.ts`,
  );
  if (!existsSync(path)) return true;
  return !readFileSync(path, 'utf8').includes('// </search-fields>');
}

export default function appendServiceSearch(_plop: NodePlopAPI): ActionType {
  return {
    type: 'modify',
    path: SERVICE_PATH,
    pattern: /^(?=\s*\/\/ \<\/search-fields\>)/m,
    templateFile: `${TEMPLATE_DIR}/service-search.hbs`,
    skip: (answers: Record<string, any>) => {
      if (!answers.addFilter) return 'append-service-search - filter not requested';
      if (!STRING_TYPES.includes(answers.type)) {
        return 'append-service-search - non-string type';
      }
      if (serviceMissingSearchMarker(answers)) {
        return 'append-service-search - service has no <search-fields> marker (legacy resource)';
      }
    },
  };
}
