import type { NodePlopAPI } from 'plop';
import { PromptQuestion } from '../../types/prompt-question';

import { DATE_TYPES, NUMBER_TYPES, STRING_TYPES } from '../constants';

const FILTERABLE_SCALAR_TYPES = [
  ...STRING_TYPES,
  ...NUMBER_TYPES,
  ...DATE_TYPES,
  'enum',
];

const FILTERABLE_RELATION_KINDS = ['manyToOne', 'oneToOne'];

export default function addFilterPrompt(_plop: NodePlopAPI): PromptQuestion {
  return {
    type: 'confirm',
    name: 'addFilter',
    message: 'generate filter for list:',
    default: false,
    when: (answers) => {
      if (answers.type === 'relation') {
        return FILTERABLE_RELATION_KINDS.includes(answers.relationKind);
      }
      if (answers.skipDb) {
        return false;
      }
      return FILTERABLE_SCALAR_TYPES.includes(answers.type);
    },
  };
}
