import { EntityRepository } from '@mikro-orm/postgresql';
import { UserIdentity } from '../domains/user-identity';

export class UserIdentityRepository extends EntityRepository<UserIdentity> {}
