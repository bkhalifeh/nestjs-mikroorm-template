import { EntityRepository } from '@mikro-orm/postgresql';
import { User } from '../domains/user';

export class UserRepository extends EntityRepository<User> {}
