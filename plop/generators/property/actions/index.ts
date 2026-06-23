import type { ActionType, NodePlopAPI } from 'plop';

import importP from './import-p';
import importApiProperty from './import-api-property';
import addEnum from './add-enum';
import importEnum from './import-enum';
import importTargetEntityIntoEntity from './import-target-entity-into-entity';
import importTargetEntityIntoDomain from './import-target-entity-into-domain';
import importCollection from './import-collection';
import appendClassProperty from './append-class-property';
import appendEntityProperty from './append-entity-property';
import appendCreateDtoProperty from './append-create-dto-property';
import appendFixtureDtoProperty from './append-fixture-dto-property';
import appendFixtureEntityProperty from './append-fixture-entity-property';
import appendListDtoProperty from './append-list-dto-property';
import appendListDtoSortable from './append-list-dto-sortable';
import appendListDtoSearchable from './append-list-dto-searchable';
import appendServiceFilter from './append-service-filter';
import appendServiceSearch from './append-service-search';
import importListDtoArray from './import-list-dto-array';
import importListDtoEnumValidator from './import-list-dto-enum-validator';
import importListDtoUuid from './import-list-dto-uuid';
import importListDtoInt from './import-list-dto-int';
import importListDtoNumber from './import-list-dto-number';
import importListDtoDate from './import-list-dto-date';
import importListDtoType from './import-list-dto-type';
import importListDtoEnum from './import-list-dto-enum';

export default function actions(plop: NodePlopAPI): ActionType[] {
  return [
    importP(plop),
    importApiProperty(plop),
    addEnum(plop),
    importEnum(plop),
    importTargetEntityIntoEntity(plop),
    importTargetEntityIntoDomain(plop),
    importCollection(plop),
    appendClassProperty(plop),
    appendEntityProperty(plop),
    appendCreateDtoProperty(plop),
    appendFixtureDtoProperty(plop),
    appendFixtureEntityProperty(plop),
    importListDtoArray(plop),
    importListDtoEnumValidator(plop),
    importListDtoUuid(plop),
    importListDtoInt(plop),
    importListDtoNumber(plop),
    importListDtoDate(plop),
    importListDtoType(plop),
    importListDtoEnum(plop),
    appendListDtoProperty(plop),
    appendListDtoSortable(plop),
    appendListDtoSearchable(plop),
    appendServiceFilter(plop),
    appendServiceSearch(plop),
  ];
}
