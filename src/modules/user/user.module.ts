import { Module } from '@nestjs/common';
// <imports>
// <import name="MikroOrmModule">
import { MikroOrmModule } from '@mikro-orm/nestjs';
// </import>
// <import name="UserEntity">
import { UserEntity } from './entities/user.entity';
// </import>
// <import name="UserIdentityEntity">
import { UserIdentityEntity } from './entities/user-identity.entity';
// </import>
// <import name="HashModule">
import { HashModule } from '../hash/hash.module';
// </import>
// <import name="UserService">
import { UserService } from './services/user.service';
// </import>
// <import name="UserController">
import { UserController } from './controllers/user.controller';
// </imports>

@Module({
  imports: [
    // <dependencies>
    // <dependency name="MikroOrmModule">
    MikroOrmModule.forFeature([
      // <entities>
      // <entity name="UserEntity">
      UserEntity,
      // </entity>
      // <entity name="UserIdentityEntity">
      UserIdentityEntity,
      // </entity>
      // </entities>
    ]),
    // </dependency>
    // <dependency name="HashModule">
    HashModule,
    // </dependency>
    // </dependencies>
  ],
  providers: [
    // <providers>
    // <provider name="UserService">
    UserService,
    // </provider>
    // </providers>
  ],
  controllers: [
    // <controllers>
    // <controller name="UserController">
    UserController,
    // </controller>
    // </controllers>
  ],
  exports: [
    // <exports>
    // <export name="UserService">
    UserService,
    // </export>
    // </exports>
  ],
})
export class UserModule {}
