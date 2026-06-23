import { PickType } from '@nestjs/swagger';
import { User } from '../domains/user';
export class UserDto extends PickType(User, ['id']) {}
