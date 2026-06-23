import { defineEntity, p } from '@mikro-orm/core';
import { BaseEntity } from '../../orm/base.entity';
import { File } from '../domains/file';
import { FileRepository } from '../repositories/file.repository';
import { FileStatus } from '../enums/file-status.enum';

export const FileEntity = defineEntity({
  name: 'File',
  class: File,
  extends: BaseEntity,
  properties: {
    // <properties>
    // <property name="key">
    key: p.string().length(1024).unique().serializedName('key'),
    // </property>
    // <property name="originalName">
    originalName: p.string().length(255).serializedName('original_name'),
    // </property>
    // <property name="mimeType">
    mimeType: p.string().length(255).serializedName('mime_type'),
    // </property>
    // <property name="size">
    size: p.bigint('number').serializedName('size'),
    // </property>
    // <property name="status">
    status: p
      .enum(() => FileStatus)
      .default(FileStatus.PENDING)
      .index()
      .serializedName('status'),
    // </property>
    // <property name="uploadedAt">
    uploadedAt: p.datetime().nullable().serializedName('uploaded_at'),
    // </property>
    // </properties>
  },
  repository: () => FileRepository,
});
