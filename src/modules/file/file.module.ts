import { Module } from '@nestjs/common';
// <imports>
// <import name="MikroOrmModule">
import { MikroOrmModule } from '@mikro-orm/nestjs';
// </import>
// <import name="FileEntity">
import { FileEntity } from './entities/file.entity';
// </import>
// <import name="FileService">
import { FileService } from './services/file.service';
// </import>
// <import name="FileController">
import { FileController } from './controllers/file.controller';
// </import>
// </imports>

@Module({
  imports: [
    // <dependencies>
    // <dependency name="MikroOrmModule">
    MikroOrmModule.forFeature([
      // <entities>
      // <entity name="FileEntity">
      FileEntity,
      // </entity>
      // </entities>
    ]),
    // </dependency>
    // </dependencies>
  ],
  providers: [
    // <providers>
    // <provider name="FileService">
    FileService,
    // </provider>
    // </providers>
  ],
  controllers: [
    // <controllers>
    // <controller name="FileController">
    FileController,
    // </controller>
    // </controllers>
  ],
  exports: [
    // <exports>
    // <export name="FileService">
    FileService,
    // </export>
    // </exports>
  ],
})
export class FileModule {}
