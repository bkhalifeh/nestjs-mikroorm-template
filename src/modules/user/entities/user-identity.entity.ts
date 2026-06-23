import { defineEntity, p } from '@mikro-orm/core';
import { BaseEntity } from '../../orm/base.entity';
import { UserIdentity } from '../domains/user-identity';
import { UserEntity } from './user.entity';
import { UserIdentityRepository } from '../repositories/user-identity.repository';
import { AuthProvider } from '../enums/auth-provider.enum';

export const UserIdentityEntity = defineEntity({
  name: 'UserIdentity',
  class: UserIdentity,
  extends: BaseEntity,
  properties: {
    // <properties>
    provider: p.enum(() => AuthProvider).serializedName('provider'),
    providerUserId: p.string().length(255).serializedName('provider_user_id'),
    email: p.string().length(255).nullable().serializedName('email'),
    user: p.manyToOne(() => UserEntity).serializedName('user'),
    // </properties>
  },
  uniques: [{ properties: ['provider', 'providerUserId'] }],
  repository: () => UserIdentityRepository,
});
