import { defineEntity, p } from '@mikro-orm/core';
import { BaseEntity } from '../../orm/base.entity';
import { User } from '../domains/user';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

export const UserEntity = defineEntity({
  name: 'User',
  class: User,
  extends: BaseEntity,
  properties: {
    // <properties>
    // <property name="email">
    email: p.string().length(255).nullable().unique().serializedName('email'),
    // </property>
    // <property name="emailVerifiedAt">
    emailVerifiedAt: p
      .datetime()
      .nullable()
      .serializedName('email_verified_at'),
    // </property>
    // <property name="phoneNumber">
    phoneNumber: p
      .string()
      .length(32)
      .nullable()
      .unique()
      .serializedName('phone_number'),
    // </property>
    // <property name="phoneVerifiedAt">
    phoneVerifiedAt: p
      .datetime()
      .nullable()
      .serializedName('phone_verified_at'),
    // </property>
    // <property name="username">
    username: p
      .string()
      .length(64)
      .nullable()
      .unique()
      .serializedName('username'),
    // </property>
    // <property name="passwordHash">
    passwordHash: p
      .string()
      .length(512)
      .nullable()
      .hidden()
      .serializedName('password_hash'),
    // </property>
    // <property name="passwordUpdatedAt">
    passwordUpdatedAt: p
      .datetime()
      .nullable()
      .hidden()
      .serializedName('password_updated_at'),
    // </property>
    // <property name="firstName">
    firstName: p.string().length(128).nullable().serializedName('first_name'),
    // </property>
    // <property name="lastName">
    lastName: p.string().length(128).nullable().serializedName('last_name'),
    // </property>
    // <property name="avatarUrl">
    avatarUrl: p.string().length(1024).nullable().serializedName('avatar_url'),
    // </property>
    // <property name="role">
    role: p
      .enum(() => UserRole)
      .default(UserRole.USER)
      .index()
      .serializedName('role'),
    // </property>
    // <property name="status">
    status: p
      .enum(() => UserStatus)
      .default(UserStatus.PENDING)
      .index()
      .serializedName('status'),
    // </property>
    // <property name="lastLoginAt">
    lastLoginAt: p.datetime().nullable().serializedName('last_login_at'),
    // </property>
    // <property name="tokenVersion">
    tokenVersion: p
      .integer()
      .default(0)
      .hidden()
      .serializedName('token_version'),
    // </property>
    // </properties>
  },
  repository: () => UserRepository,
});
