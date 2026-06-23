import type { ActionType, NodePlopAPI } from 'plop';

import removeDomainProperty from './remove-domain-property';
import removeEntityProperty from './remove-entity-property';
import removeCreateDtoProperty from './remove-create-dto-property';
import removeServiceSpecFixture from './remove-service-spec-fixture';
import removeControllerSpecFixture from './remove-controller-spec-fixture';
import removePImport from './remove-p-import';
import removeApiPropertyImport from './remove-api-property-import';
import removeListDtoProperty from './remove-list-dto-property';
import removeListDtoSortable from './remove-list-dto-sortable';
import removeListDtoSearchable from './remove-list-dto-searchable';
import removeServiceFilter from './remove-service-filter';
import removeServiceSearch from './remove-service-search';

export default function actions(plop: NodePlopAPI): ActionType[] {
  return [
    removeDomainProperty(plop),
    removeEntityProperty(plop),
    removeCreateDtoProperty(plop),
    removeServiceSpecFixture(plop),
    removeControllerSpecFixture(plop),
    removeListDtoProperty(plop),
    removeListDtoSortable(plop),
    removeListDtoSearchable(plop),
    removeServiceFilter(plop),
    removeServiceSearch(plop),
    removePImport(plop),
    removeApiPropertyImport(plop),
  ];
}
