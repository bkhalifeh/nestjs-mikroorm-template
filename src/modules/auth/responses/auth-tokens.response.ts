import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { OkResponse } from '../../../common/responses/ok.response';
import { CreatedResponse } from '../../../common/responses/created.response';
import { User } from '../../user/domains/user';
import type { AuthResult } from '../services/auth.service';

export class AuthTokensData {
  @ApiProperty({ type: () => User })
  user!: User;

  @ApiProperty({ type: 'string' })
  @Expose({ name: 'access_token' })
  accessToken!: string;

  @ApiProperty({ type: 'string' })
  @Expose({ name: 'refresh_token' })
  refreshToken!: string;

  @ApiProperty({ type: 'string', enum: ['Bearer'] })
  @Expose({ name: 'token_type' })
  tokenType = 'Bearer' as const;

  @ApiProperty({ type: 'integer' })
  @Expose({ name: 'access_expires_in' })
  accessExpiresIn!: number;

  @ApiProperty({ type: 'integer' })
  @Expose({ name: 'refresh_expires_in' })
  refreshExpiresIn!: number;

  constructor(args: AuthResult) {
    this.user = args.user;
    this.accessToken = args.tokens.accessToken;
    this.refreshToken = args.tokens.refreshToken;
    this.tokenType = args.tokens.tokenType;
    this.accessExpiresIn = args.tokens.accessExpiresIn;
    this.refreshExpiresIn = args.tokens.refreshExpiresIn;
  }
}

export class AuthTokensCreatedResponse extends CreatedResponse {
  @ApiProperty({ type: () => AuthTokensData })
  data!: AuthTokensData;
  constructor(result: AuthResult) {
    super();
    this.data = new AuthTokensData(result);
  }
}

export class AuthTokensOkResponse extends OkResponse {
  @ApiProperty({ type: () => AuthTokensData })
  data!: AuthTokensData;
  constructor(result: AuthResult) {
    super();
    this.data = new AuthTokensData(result);
  }
}
