import type { NodePlopAPI } from 'plop';
import { PromptQuestion } from '../../types/prompt-question';

import { DATE_TYPES, NUMBER_TYPES, STRING_TYPES } from '../constants';

const SORTABLE_TYPES = [
  ...STRING_TYPES,
  ...NUMBER_TYPES,
  ...DATE_TYPES,
  'enum',
  'boolean',
  'uuid',
];

export default function addSortPrompt(_plop: NodePlopAPI): PromptQuestion {
  return {
    type: 'confirm',
    name: 'addSort',
    message: 'allow ordering by this property:',
    default: false,
    when: (answers) => {
      if (answers.type === 'relation') {
        return false;
      }
      if (answers.skipDb) {
        return false;
      }
      return SORTABLE_TYPES.includes(answers.type);
    },
  };
}
