import { Base } from '../../orm/base.entity';
import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { AuthProvider } from '../enums/auth-provider.enum';
import { User } from './user';

export class UserIdentity extends Base {
  // <properties>
  // <property name="provider">
  @ApiProperty({
    name: 'provider',
    type: 'enum',
    enum: AuthProvider,
  })
  provider!: AuthProvider;
  // </property>
  // <property name="providerUserId">
  @ApiProperty({
    name: 'provider_user_id',
    type: 'string',
    maxLength: 255,
  })
  providerUserId!: string;
  // </property>
  // <property name="email">
  @ApiProperty({
    name: 'email',
    type: 'string',
    nullable: true,
    maxLength: 255,
  })
  email?: string | null;
  // </property>
  // </properties>

  user!: User;
}
