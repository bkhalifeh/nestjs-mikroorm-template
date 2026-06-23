import type { ActionType, NodePlopAPI } from 'plop';

import { TEMPLATE_DIR } from '../constants';

export default function addListDto(_plop: NodePlopAPI): ActionType {
  return {
    type: 'add',
    path: 'src/modules/{{kebabCase name}}/dto/list-{{kebabCase name}}.dto.ts',
    templateFile: `${TEMPLATE_DIR}/list-dto.hbs`,
    skip: (answers: Record<string, any>) => {
      if (!answers.genCRUD) {
        return 'skip generate list-dto.hbs';
      }
    },
  };
}
