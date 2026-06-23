import { ApiProperty } from '../../../common/decorators/api-property.decorator';

export class CreateFileDto {
  // <properties>
  // <property name="originalName">
  @ApiProperty({
    name: 'original_name',
    type: 'string',
    addValidator: true,
    minLength: 1,
    maxLength: 255,
  })
  originalName!: string;
  // </property>
  // <property name="mimeType">
  @ApiProperty({
    name: 'mime_type',
    type: 'string',
    addValidator: true,
    format: 'MimeType',
    maxLength: 255,
  })
  mimeType!: string;
  // </property>
  // <property name="size">
  @ApiProperty({
    name: 'size',
    type: 'integer',
    addValidator: true,
    minNumber: 1,
  })
  size!: number;
  // </property>
  // </properties>
}
