import { Base } from '../../orm/base.entity';
import { ApiProperty } from '../../../common/decorators/api-property.decorator';
import { FileStatus } from '../enums/file-status.enum';

export class File extends Base {
  // <properties>
  // <property name="key">
  @ApiProperty({
    name: 'key',
    type: 'string',
    maxLength: 1024,
  })
  key!: string;
  // </property>
  // <property name="originalName">
  @ApiProperty({
    name: 'original_name',
    type: 'string',
    maxLength: 255,
  })
  originalName!: string;
  // </property>
  // <property name="mimeType">
  @ApiProperty({
    name: 'mime_type',
    type: 'string',
    maxLength: 255,
  })
  mimeType!: string;
  // </property>
  // <property name="size">
  @ApiProperty({
    name: 'size',
    type: 'bigint',
  })
  size!: number;
  // </property>
  // <property name="status">
  @ApiProperty({
    name: 'status',
    type: 'enum',
    enum: FileStatus,
  })
  status!: FileStatus;
  // </property>
  // <property name="uploadedAt">
  @ApiProperty({
    name: 'uploaded_at',
    type: 'datetime',
    nullable: true,
  })
  uploadedAt?: Date | null;
  // </property>
  // </properties>
}
