import {
  BadRequestException,
  ConflictException,
  Inject,
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
// <import name="S3">
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
// </import>
// <import name="getSignedUrl">
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// </import>
// <import name="InjectS3">
import { InjectS3 } from 'nestjs-s3';
// </import>
// <import name="uuid">
import { v7 } from 'uuid';
// </import>
// <import name="S3Config">
import { S3_CONFIG_PROVIDER } from '../../config/resources/s3-resource';
import type { S3ConfigType } from '../../config/resources/s3-resource';
// </import>
// <import name="CreateFileDto">
import { CreateFileDto } from '../dto/create-file.dto';
// </import>
// <import name="ListFileQueryDto">
import {
  ListFileQueryDto,
  LIST_FILE_SEARCHABLE_FIELDS,
} from '../dto/list-file.dto';
// </import>
// <import name="FileRepository">
import { FileRepository } from '../repositories/file.repository';
// </import>
// <import name="File">
import { File } from '../domains/file';
// </import>
// <import name="FileStatus">
import { FileStatus } from '../enums/file-status.enum';
// </import>
// </imports>

export interface PresignedUpload {
  file: File;
  url: string;
  headers: Record<string, string>;
  expiresIn: number;
  expiresAt: Date;
}

export interface PresignedDownload {
  file: File;
  url: string;
  expiresIn: number;
  expiresAt: Date;
}

const SAFE_FILENAME_RE = /[^a-zA-Z0-9._-]+/g;

@Injectable()
export class FileService {
  constructor(
    // <properties>
    // <property name="logger">
    @InjectPinoLogger(FileService.name)
    private readonly logger: PinoLogger,
    // </property>
    // <property name="clsService">
    private readonly clsService: ClsService,
    // </property>
    // <property name="em">
    private readonly em: EntityManager,
    // </property>
    // <property name="fileRepository">
    private readonly fileRepository: FileRepository,
    // </property>
    // <property name="s3">
    @InjectS3()
    private readonly s3: S3,
    // </property>
    // <property name="s3Config">
    @Inject(S3_CONFIG_PROVIDER.KEY)
    private readonly s3Config: S3ConfigType,
    // </property>
    // </properties>
  ) {}

  // <functions>
  // <function name="create">
  async create(createFileDto: CreateFileDto): Promise<PresignedUpload> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, createFileDto }, 'Creating file');

    if (createFileDto.size > this.s3Config.maxUploadSizeBytes) {
      this.logger.warn(
        {
          requestId,
          size: createFileDto.size,
          max: this.s3Config.maxUploadSizeBytes,
        },
        'Requested upload exceeds maximum allowed size',
      );
      throw new BadRequestException(
        `File size ${String(createFileDto.size)} exceeds the maximum allowed of ${String(this.s3Config.maxUploadSizeBytes)} bytes`,
      );
    }

    const id = v7();
    const key = this.buildObjectKey(id, createFileDto.originalName);

    const file = this.fileRepository.create({
      id,
      key,
      originalName: createFileDto.originalName,
      mimeType: createFileDto.mimeType,
      size: createFileDto.size,
      status: FileStatus.PENDING,
      uploadedAt: null,
    });
    await this.em.flush();

    const expiresIn = this.s3Config.uploadUrlTtlSeconds;
    const command = new PutObjectCommand({
      Bucket: this.s3Config.bucket,
      Key: key,
      ContentType: createFileDto.mimeType,
      ContentLength: createFileDto.size,
      Metadata: {
        'file-id': id,
        'original-name': encodeURIComponent(createFileDto.originalName),
      },
    });

    const url = await getSignedUrl(this.s3 as never, command as never, {
      expiresIn,
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    this.logger.info(
      { requestId, id, key, expiresAt },
      'File created successfully',
    );

    return {
      file,
      url,
      headers: {
        'Content-Type': createFileDto.mimeType,
        'Content-Length': String(createFileDto.size),
      },
      expiresIn,
      expiresAt,
    };
  }
  // </function>

  // <function name="confirm">
  async confirm(id: string): Promise<File> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, id }, 'Confirming uploaded file');

    const file = await this.findOne(id);

    if (file.status === FileStatus.UPLOADED) {
      this.logger.info({ requestId, id }, 'File already confirmed');
      return file;
    }

    const head = await this.headObject(file.key).catch((err: unknown) => {
      this.logger.warn(
        { requestId, id, key: file.key, err },
        'Object not found in storage when confirming upload',
      );
      throw new BadRequestException(
        'Upload not found in storage. Make sure the client completed the PUT request before confirming.',
      );
    });

    if (typeof head.ContentLength === 'number' && head.ContentLength > 0) {
      file.size = head.ContentLength;
    }
    if (head.ContentType) {
      file.mimeType = head.ContentType;
    }
    file.status = FileStatus.UPLOADED;
    file.uploadedAt = new Date();
    await this.em.flush();

    this.logger.info({ requestId, id }, 'File confirmed as uploaded');
    return file;
  }
  // </function>

  // <function name="getDownloadUrl">
  async getDownloadUrl(id: string): Promise<PresignedDownload> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, id }, 'Creating pre-signed download URL');

    const file = await this.findOne(id);

    if (file.status !== FileStatus.UPLOADED) {
      this.logger.warn(
        { requestId, id, status: file.status },
        'Cannot download a file that has not finished uploading',
      );
      throw new ConflictException(
        'File upload has not been completed; download is not available yet.',
      );
    }

    const expiresIn = this.s3Config.downloadUrlTtlSeconds;
    const command = new GetObjectCommand({
      Bucket: this.s3Config.bucket,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename="${this.sanitizeForHeader(file.originalName)}"`,
      ResponseContentType: file.mimeType,
    });

    const url = await getSignedUrl(this.s3 as never, command as never, {
      expiresIn,
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    this.logger.info(
      { requestId, id, expiresAt },
      'Pre-signed download URL created',
    );

    return { file, url, expiresIn, expiresAt };
  }
  // </function>

  // <function name="findAll">
  async findAll(query: ListFileQueryDto): Promise<[File[], number]> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, query }, 'Fetching files');

    const where = this.buildFileWhere(query);
    const orderBy = query.order ?? { id: 'ASC' };

    const total = await this.fileRepository.count(where);
    const lastPage = Math.max(1, Math.ceil(total / query.perPage));

    if (query.page > lastPage) {
      this.logger.warn(
        { requestId, page: query.page, lastPage },
        'Files page out of range',
      );
      throw new BadRequestException(
        `Page ${String(query.page)} is out of range; last page is ${String(lastPage)}`,
      );
    }

    if (total === 0) {
      this.logger.info({ requestId, total: 0 }, 'No files to fetch');
      return [[], 0];
    }

    const offset = (query.page - 1) * query.perPage;
    const files = await this.fileRepository.find(where, {
      offset,
      limit: query.perPage,
      orderBy,
    });

    this.logger.info(
      { requestId, count: files.length, total },
      'Files fetched successfully',
    );
    return [files, total];
  }

  private buildFileWhere(query: ListFileQueryDto): FilterQuery<File> {
    const where: Record<string, unknown> = {};

    // <filters>
    if (query.status) {
      where['status'] = query.status;
    }
    // </filters>

    if (query.search && LIST_FILE_SEARCHABLE_FIELDS.length > 0) {
      const term = `%${query.search}%`;
      const $or: Record<string, unknown>[] = [];
      // <search-fields>
      $or.push({ originalName: { $ilike: term } });
      $or.push({ mimeType: { $ilike: term } });
      // </search-fields>
      if ($or.length > 0) {
        where['$or'] = $or;
      }
    }

    return where;
  }
  // </function>

  // <function name="findOne">
  async findOne(id: string): Promise<File> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, id }, 'Fetching file by id');

    const file = await this.fileRepository.findOne({ id });

    if (!file) {
      this.logger.warn({ requestId, id }, 'File not found');
      throw new NotFoundException(`File with id ${id} not found`);
    }

    this.logger.info({ requestId, id }, 'File fetched successfully');
    return file;
  }
  // </function>

  // <function name="remove">
  async remove(id: string): Promise<void> {
    const requestId = this.clsService.get<string>('requestId');
    this.logger.info({ requestId, id }, 'Removing file');

    const file = await this.findOne(id);

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: file.key,
      }),
    );

    this.em.remove(file);
    await this.em.flush();
    this.logger.info({ requestId, id }, 'File removed successfully');
  }
  // </function>
  // </functions>

  private buildObjectKey(id: string, originalName: string): string {
    const lastDot = originalName.lastIndexOf('.');
    const ext =
      lastDot > 0 && lastDot < originalName.length - 1
        ? originalName
            .slice(lastDot)
            .toLowerCase()
            .replace(SAFE_FILENAME_RE, '')
        : '';
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const prefix = this.s3Config.keyPrefix.replace(/^\/+|\/+$/g, '');
    return `${prefix}/${String(year)}/${month}/${day}/${id}${ext}`;
  }

  private sanitizeForHeader(filename: string): string {
    return filename.replace(/[\r\n"\\]/g, '_');
  }

  private async headObject(key: string): Promise<{
    ContentLength: number | undefined;
    ContentType: string | undefined;
  }> {
    const head = await this.s3.send(
      new HeadObjectCommand({
        Bucket: this.s3Config.bucket,
        Key: key,
      }),
    );
    return {
      ContentLength: head.ContentLength,
      ContentType: head.ContentType,
    };
  }
}
