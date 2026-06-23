import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// <imports>
// <import name="EntityManager">
import { EntityManager } from '@mikro-orm/postgresql';
// </import>
// <import name="FilterQuery">
import type { FilterQuery } from '@mikro-orm/postgresql';
// </import>
// <import name="ClsService">
import { ClsService } from 'nestjs-cls';
// </import>
// <import name="PinoLogger">
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
// </import>
// <import name="PasswordHasher">
import type { PasswordHasher } from '../../hash/interfaces/password-hasher.interface';
import { InjectPasswordHasher } from '../../hash/decorators/inject-password-hasher.decorator';
// </import>
// <import name="CreateUserDto">
import { CreateUserDto } from '../dto/create-user.dto';
// </import>
// <import name="UpdateUserDto">
import { UpdateUserDto } from '../dto/update-user.dto';
// </import>
// <import name="UpdateProfileDto">
import { UpdateProfileDto } from '../dto/update-profile.dto';
// </import>
// <import name="ListUserQueryDto">
import {
  ListUserQueryDto,
  LIST_USER_SEARCHABLE_FIELDS,
} from '../dto/list-user.dto';
// </import>
// <import name="UserRepository">
import { UserRepository } from '../repositories/user.repository';
// </import>
// <import name="UserIdentityRepository">
import { UserIdentityRepository } from '../repositories/user-identity.repository';
// </import>
// <import name="User">
import { User } from '../domains/user';
// </import>
// <import name="UserIdentity">
import { UserIdentity } from '../domains/user-identity';
// </import>
// <import name="enums">
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { AuthProvider } from '../enums/auth-provider.enum';
// </import>
// </imports>

export interface CreateOAuthUserInput {
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  emailVerified?: boolean | undefined;
}

@Injectable()
export class UserService {
  constructor(
    // <properties>
    // <property name="logger">
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
    // </property>
    // <property name="clsService">
    private readonly clsService: ClsService,
    // </property>
    // <property name="em">
    private readonly em: EntityManager,
    // </property>
    // <property name="userRepository">
    private readonly userRepository: UserRepository,
    // </property>
    // <property name="identityRepository">
    private readonly identityRepository: UserIdentityRepository,
    // </property>
    // <property name="passwordHasher">
    @InjectPasswordHasher()
    private readonly passwordHasher: PasswordHasher,
    // </property>
    // </properties>
  ) {}

  // <functions>
  // <function name="create">
  async create(createUserDto: CreateUserDto): Promise<User> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info(
      { requestId, email: createUserDto.email },
      'Creating user',
    );

    await this.ensureIdentifiersFree({
      email: createUserDto.email,
      username: createUserDto.username,
      phoneNumber: createUserDto.phoneNumber,
    });

    const passwordHash = createUserDto.password
      ? await this.passwordHasher.hash(createUserDto.password)
      : null;

    const user = this.userRepository.create({
      email: this.normalizeEmail(createUserDto.email),
      phoneNumber: createUserDto.phoneNumber ?? null,
      username: createUserDto.username?.toLowerCase() ?? null,
      passwordHash,
      passwordUpdatedAt: passwordHash ? new Date() : null,
      firstName: createUserDto.firstName ?? null,
      lastName: createUserDto.lastName ?? null,
      role: createUserDto.role ?? UserRole.USER,
      status: createUserDto.status ?? UserStatus.ACTIVE,
      tokenVersion: 0,
    });
    await this.em.flush();

    this.logger.info({ requestId, id: user.id }, 'User created successfully');
    return user;
  }
  // </function>

  // <function name="findAll">
  async findAll(query: ListUserQueryDto): Promise<[User[], number]> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, query }, 'Fetching users');

    const where = this.buildUserWhere(query);
    const orderBy = query.order ?? { id: 'ASC' };

    const total = await this.userRepository.count(where);
    const lastPage = Math.max(1, Math.ceil(total / query.perPage));

    if (query.page > lastPage) {
      this.logger.warn(
        { requestId, page: query.page, lastPage },
        'Users page out of range',
      );
      throw new BadRequestException(
        `Page ${String(query.page)} is out of range; last page is ${String(lastPage)}`,
      );
    }

    if (total === 0) {
      this.logger.info({ requestId, total: 0 }, 'No users to fetch');
      return [[], 0];
    }

    const offset = (query.page - 1) * query.perPage;
    const users = await this.userRepository.find(where, {
      offset,
      limit: query.perPage,
      orderBy,
    });

    this.logger.info(
      { requestId, count: users.length, total },
      'Users fetched successfully',
    );
    return [users, total];
  }

  private buildUserWhere(query: ListUserQueryDto): FilterQuery<User> {
    const where: Record<string, unknown> = {};

    // <filters>
    if (query.role) where['role'] = query.role;
    if (query.status) where['status'] = query.status;
    // </filters>

    if (query.search && LIST_USER_SEARCHABLE_FIELDS.length > 0) {
      const term = `%${query.search}%`;
      const $or: Record<string, unknown>[] = [];
      // <search-fields>
      $or.push({ email: { $ilike: term } });
      $or.push({ username: { $ilike: term } });
      $or.push({ phoneNumber: { $ilike: term } });
      $or.push({ firstName: { $ilike: term } });
      $or.push({ lastName: { $ilike: term } });
      // </search-fields>
      if ($or.length > 0) {
        where['$or'] = $or;
      }
    }

    return where;
  }
  // </function>

  // <function name="findOne">
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
  // </function>

  // <function name="findByEmail">
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email: this.normalizeEmail(email) });
  }
  // </function>

  // <function name="findByUsername">
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ username: username.toLowerCase() });
  }
  // </function>

  // <function name="findByPhone">
  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ phoneNumber });
  }
  // </function>

  // <function name="findByLogin">
  async findByLogin(identifier: string): Promise<User | null> {
    const normalized = identifier.trim();
    if (normalized.includes('@')) {
      return this.findByEmail(normalized);
    }
    return this.findByUsername(normalized);
  }
  // </function>

  // <function name="update">
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, id }, 'Updating user');

    const user = await this.findOne(id);

    await this.ensureIdentifiersFree(
      {
        email: updateUserDto.email,
        username: updateUserDto.username,
        phoneNumber: updateUserDto.phoneNumber,
      },
      id,
    );

    if (updateUserDto.email !== undefined) {
      user.email = this.normalizeEmail(updateUserDto.email);
    }
    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username?.toLowerCase() ?? null;
    }
    if (updateUserDto.phoneNumber !== undefined) {
      user.phoneNumber = updateUserDto.phoneNumber ?? null;
    }
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName ?? null;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName ?? null;
    }
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;
    if (updateUserDto.status !== undefined) user.status = updateUserDto.status;

    await this.em.flush();
    this.logger.info({ requestId, id }, 'User updated successfully');
    return user;
  }
  // </function>

  // <function name="updateProfile">
  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.firstName !== undefined) user.firstName = dto.firstName ?? null;
    if (dto.lastName !== undefined) user.lastName = dto.lastName ?? null;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl ?? null;
    await this.em.flush();
    return user;
  }
  // </function>

  // <function name="changePassword">
  async changePassword(
    id: string,
    currentPassword: string | undefined,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(id);

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required.');
      }
      const ok = await this.passwordHasher.verify(
        user.passwordHash,
        currentPassword,
      );
      if (!ok) {
        throw new BadRequestException('Current password is incorrect.');
      }
    }

    user.passwordHash = await this.passwordHasher.hash(newPassword);
    user.passwordUpdatedAt = new Date();
    user.tokenVersion += 1;
    await this.em.flush();
  }
  // </function>

  // <function name="setPasswordHash">
  async setPasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = await this.findOne(id);
    user.passwordHash = passwordHash;
    user.passwordUpdatedAt = new Date();
    user.tokenVersion += 1;
    await this.em.flush();
  }
  // </function>

  // <function name="markEmailVerified">
  async markEmailVerified(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.emailVerifiedAt = new Date();
    if (user.status === UserStatus.PENDING) user.status = UserStatus.ACTIVE;
    await this.em.flush();
  }
  // </function>

  // <function name="markPhoneVerified">
  async markPhoneVerified(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.phoneVerifiedAt = new Date();
    if (user.status === UserStatus.PENDING) user.status = UserStatus.ACTIVE;
    await this.em.flush();
  }
  // </function>

  // <function name="touchLastLogin">
  async touchLastLogin(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.lastLoginAt = new Date();
    await this.em.flush();
  }
  // </function>

  // <function name="bumpTokenVersion">
  async bumpTokenVersion(id: string): Promise<number> {
    const user = await this.findOne(id);
    user.tokenVersion += 1;
    await this.em.flush();
    return user.tokenVersion;
  }
  // </function>

  // <function name="findOrCreateOAuth">
  async findOrCreateOAuth(input: CreateOAuthUserInput): Promise<User> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info(
      {
        requestId,
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
      'Resolving OAuth user',
    );

    const identity = await this.identityRepository.findOne(
      {
        provider: input.provider,
        providerUserId: input.providerUserId,
      },
      { populate: ['user'] },
    );
    if (identity) {
      return identity.user;
    }

    const normalizedEmail = this.normalizeEmail(input.email);
    let user: User | null = null;
    if (normalizedEmail) {
      user = await this.userRepository.findOne({ email: normalizedEmail });
    }

    if (!user) {
      user = this.userRepository.create({
        email: normalizedEmail,
        emailVerifiedAt: input.emailVerified ? new Date() : null,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        avatarUrl: input.avatarUrl ?? null,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        tokenVersion: 0,
      });
    } else if (input.emailVerified && !user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
    }

    this.identityRepository.create({
      provider: input.provider,
      providerUserId: input.providerUserId,
      email: normalizedEmail,
      user,
    } as UserIdentity);

    await this.em.flush();
    return user;
  }
  // </function>

  // <function name="remove">
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    this.em.remove(user);
    await this.em.flush();
  }
  // </function>
  // </functions>

  private normalizeEmail(email?: string | null): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
  }

  private async ensureIdentifiersFree(
    fields: {
      email?: string | null | undefined;
      username?: string | null | undefined;
      phoneNumber?: string | null | undefined;
    },
    ignoreUserId?: string,
  ): Promise<void> {
    const checks: Array<{
      field: 'email' | 'username' | 'phoneNumber';
      value: string;
    }> = [];
    if (fields.email) {
      checks.push({
        field: 'email',
        value: this.normalizeEmail(fields.email)!,
      });
    }
    if (fields.username) {
      checks.push({ field: 'username', value: fields.username.toLowerCase() });
    }
    if (fields.phoneNumber) {
      checks.push({ field: 'phoneNumber', value: fields.phoneNumber });
    }
    for (const { field, value } of checks) {
      const existing = await this.userRepository.findOne({
        [field]: value,
      });
      if (existing && existing.id !== ignoreUserId) {
        throw new ConflictException(
          `A user with this ${field} already exists.`,
        );
      }
    }
  }
}
