import { PickType } from '@nestjs/swagger';
import { File } from '../domains/file';

export class FileDto extends PickType(File, ['id']) {}
