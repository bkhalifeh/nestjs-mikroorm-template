import { EntityRepository } from '@mikro-orm/postgresql';
import { File } from '../domains/file';

export class FileRepository extends EntityRepository<File> {}
