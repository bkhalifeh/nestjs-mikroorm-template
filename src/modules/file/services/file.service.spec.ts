import { Test, TestingModule } from '@nestjs/testing';
import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  it,
  expect,
  vi,
} from 'vitest';
// <imports>
// <import>
import { newDb } from 'pg-mem';
// </import>
// <import name="@mikro-orm/postgresql">
import {
  AbstractSqlDriver,
  EntityManager,
  MikroORM,
  PostgreSqlConnection,
  PostgreSqlPlatform,
  SchemaGenerator,
} from '@mikro-orm/postgresql';
// </import>
// <import name="PostgresDialect">
import { PostgresDialect } from 'kysely';
// </import>
// <import name="getLoggerToken">
import { getLoggerToken } from 'nestjs-pino';
// </import>
// <import name="ClsService">
import { ClsService } from 'nestjs-cls';
// </import>
// <import name="@nestjs/common">
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
// </import>
// <import name="@aws-sdk/client-s3">
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
// </import>
// <import name="getSignedUrl">
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// </import>
// <import name="getS3ConnectionToken">
import { getS3ConnectionToken } from 'nestjs-s3';
// </import>
// <import name="FileService">
import { FileService } from './file.service';
// </import>
// <import name="File">
import { File } from '../domains/file';
// </import>
// <import name="FileEntity">
import { FileEntity } from '../entities/file.entity';
// </import>
// <import name="FileRepository">
import { FileRepository } from '../repositories/file.repository';
// </import>
// <import name="FileStatus">
import { FileStatus } from '../enums/file-status.enum';
// </import>
// <import name="CreateFileDto">
import { CreateFileDto } from '../dto/create-file.dto';
// </import>
// <import name="S3Config">
import { S3_CONFIG_PROVIDER } from '../../config/resources/s3-resource';
import type { S3ConfigType } from '../../config/resources/s3-resource';
// </import>
// </imports>

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

const s3Config: S3ConfigType = {
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
  bucket: 'test-bucket',
  forcePathStyle: true,
  uploadUrlTtlSeconds: 900,
  downloadUrlTtlSeconds: 900,
  maxUploadSizeBytes: 50 * 1024 * 1024,
  keyPrefix: 'uploads',
};

function buildCreateDto(overrides: Partial<CreateFileDto> = {}): CreateFileDto {
  return {
    originalName: 'cat.png',
    mimeType: 'image/png',
    size: 1024,
    ...overrides,
  };
}

describe('FileService', () => {
  let orm: MikroORM;
  let service: FileService;
  let s3Send: ReturnType<typeof vi.fn>;
  const signedUrlMock = vi.mocked(getSignedUrl);

  beforeAll(async () => {
    const db = newDb();
    const pgMem = db.adapters.createPg();

    class PgMemConnection extends PostgreSqlConnection {
      override createKyselyDialect() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        return new PostgresDialect({ pool: new pgMem.Pool() });
      }
    }

    class PgMemDriver extends AbstractSqlDriver<PgMemConnection> {
      constructor(config: never) {
        super(config, new PostgreSqlPlatform(), PgMemConnection, [
          'knex',
          'pg',
        ]);
      }
    }

    orm = await MikroORM.init({
      driver: PgMemDriver as never,
      dbName: 'public',
      entities: [
        // <entities>
        // <entity name="FileEntity">
        FileEntity,
        // </entity>
        // </entities>
      ],
      allowGlobalContext: true,
      extensions: [SchemaGenerator],
    });

    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(File, {});
    orm.em.clear();
    signedUrlMock.mockReset();
    signedUrlMock.mockResolvedValue(
      'https://signed.example.com/uploads/object',
    );

    const forkedEm = orm.em.fork();
    s3Send = vi.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // <providers>
        // <provider name="FileService">
        FileService,
        // </provider>
        // <provider name="EntityManager">
        { provide: EntityManager, useValue: forkedEm },
        // </provider>
        // <provider name="FileRepository">
        {
          provide: FileRepository,
          useFactory: (entityManager: EntityManager): FileRepository =>
            entityManager.getRepository(File),
          inject: [EntityManager],
        },
        // </provider>
        // <provider name="ClsService">
        {
          provide: ClsService,
          useValue: { get: vi.fn().mockReturnValue('test-request-id') },
        },
        // </provider>
        // <provider name="PinoLogger">
        {
          provide: getLoggerToken(FileService.name),
          useValue: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
          },
        },
        // </provider>
        // <provider name="S3">
        {
          provide: getS3ConnectionToken('default'),
          useValue: { send: s3Send },
        },
        // </provider>
        // <provider name="S3Config">
        { provide: S3_CONFIG_PROVIDER.KEY, useValue: s3Config },
        // </provider>
        // </providers>
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // <functions>
  // <function name="create">
  describe('create', () => {
    it('persists a pending file row and returns a presigned PUT URL', async () => {
      const dto = buildCreateDto();

      const result = await service.create(dto);

      expect(result.file.id).toEqual(expect.any(String));
      expect(result.file.status).toBe(FileStatus.PENDING);
      expect(result.file.key).toMatch(
        /^uploads\/\d{4}\/\d{2}\/\d{2}\/.+\.png$/,
      );
      expect(result.headers).toEqual({
        'Content-Type': 'image/png',
        'Content-Length': '1024',
      });
      expect(result.expiresIn).toBe(s3Config.uploadUrlTtlSeconds);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.url).toBe('https://signed.example.com/uploads/object');

      expect(signedUrlMock).toHaveBeenCalledOnce();
      const [, command] = signedUrlMock.mock.calls[0]!;
      expect(command).toBeInstanceOf(PutObjectCommand);

      const persisted = await orm.em
        .fork()
        .findOne(File, { id: result.file.id });
      expect(persisted).not.toBeNull();
      expect(persisted!.status).toBe(FileStatus.PENDING);
    });

    it('rejects an upload larger than the configured maximum', async () => {
      await expect(
        service.create(
          buildCreateDto({ size: s3Config.maxUploadSizeBytes + 1 }),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(signedUrlMock).not.toHaveBeenCalled();
    });

    it('drops dangerous characters from the extension before building the key', async () => {
      const result = await service.create(
        buildCreateDto({ originalName: 'photo .. /etc/passwd.png' }),
      );

      expect(result.file.key.endsWith('.png')).toBe(true);
      expect(result.file.key).not.toContain('/etc');
    });
  });
  // </function>

  // <function name="confirm">
  describe('confirm', () => {
    it('flips status to UPLOADED and refreshes size/mime from HeadObject', async () => {
      const { file } = await service.create(buildCreateDto());
      s3Send.mockResolvedValueOnce({
        ContentLength: 2048,
        ContentType: 'image/jpeg',
      });

      const confirmed = await service.confirm(file.id);

      expect(confirmed.status).toBe(FileStatus.UPLOADED);
      expect(confirmed.size).toBe(2048);
      expect(confirmed.mimeType).toBe('image/jpeg');
      expect(confirmed.uploadedAt).toBeInstanceOf(Date);

      expect(s3Send).toHaveBeenCalledOnce();
      const [headCommand] = s3Send.mock.calls[0]! as [unknown];
      expect(headCommand).toBeInstanceOf(HeadObjectCommand);
    });

    it('is idempotent: confirming an already-uploaded file returns it untouched', async () => {
      const { file } = await service.create(buildCreateDto());
      s3Send.mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: 'image/png',
      });
      await service.confirm(file.id);

      s3Send.mockClear();
      const again = await service.confirm(file.id);

      expect(again.status).toBe(FileStatus.UPLOADED);
      expect(s3Send).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the object is missing in S3', async () => {
      const { file } = await service.create(buildCreateDto());
      s3Send.mockRejectedValueOnce(new Error('NotFound'));

      await expect(service.confirm(file.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws NotFoundException when the file id does not exist', async () => {
      await expect(
        service.confirm('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
  // </function>

  // <function name="getDownloadUrl">
  describe('getDownloadUrl', () => {
    it('returns a presigned GET URL for an uploaded file', async () => {
      const { file } = await service.create(buildCreateDto());
      s3Send.mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: 'image/png',
      });
      await service.confirm(file.id);

      signedUrlMock.mockResolvedValueOnce(
        'https://signed.example.com/download',
      );
      const result = await service.getDownloadUrl(file.id);

      expect(result.url).toBe('https://signed.example.com/download');
      expect(result.expiresIn).toBe(s3Config.downloadUrlTtlSeconds);
      expect(result.expiresAt).toBeInstanceOf(Date);
      const [, command] = signedUrlMock.mock.calls.at(-1)!;
      expect(command).toBeInstanceOf(GetObjectCommand);
    });

    it('refuses to sign a download for a still-pending file', async () => {
      const { file } = await service.create(buildCreateDto());

      await expect(service.getDownloadUrl(file.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws NotFoundException when the file id does not exist', async () => {
      await expect(
        service.getDownloadUrl('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
  // </function>

  // <function name="findAll">
  describe('findAll', () => {
    it('returns an empty page and zero total when there are no records', async () => {
      const [items, total] = await service.findAll({
        page: 1,
        perPage: 20,
      });
      expect(items).toEqual([]);
      expect(total).toBe(0);
    });

    it('honours pagination via page + perPage', async () => {
      await service.create(buildCreateDto({ originalName: 'a.png' }));
      await service.create(buildCreateDto({ originalName: 'b.png' }));
      await service.create(buildCreateDto({ originalName: 'c.png' }));

      const [items, total] = await service.findAll({
        page: 2,
        perPage: 2,
      });
      expect(items).toHaveLength(1);
      expect(total).toBe(3);
    });

    it('filters by status', async () => {
      const { file } = await service.create(
        buildCreateDto({ originalName: 'a.png' }),
      );
      s3Send.mockResolvedValueOnce({
        ContentLength: 1024,
        ContentType: 'image/png',
      });
      await service.confirm(file.id);
      await service.create(buildCreateDto({ originalName: 'b.png' }));

      const [items, total] = await service.findAll({
        page: 1,
        perPage: 20,
        status: FileStatus.UPLOADED,
      });

      expect(total).toBe(1);
      expect(items[0]!.id).toBe(file.id);
    });

    it('searches by original_name', async () => {
      await service.create(
        buildCreateDto({
          originalName: 'invoice-2026.pdf',
          mimeType: 'application/pdf',
        }),
      );
      await service.create(buildCreateDto({ originalName: 'cat.png' }));

      const [items, total] = await service.findAll({
        page: 1,
        perPage: 20,
        search: 'invoice',
      });

      expect(total).toBe(1);
      expect(items[0]!.originalName).toBe('invoice-2026.pdf');
    });

    it('throws BadRequestException when page exceeds last page', async () => {
      await service.create(buildCreateDto());
      await service.create(buildCreateDto());

      await expect(
        service.findAll({ page: 5, perPage: 2 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
  // </function>

  // <function name="findOne">
  describe('findOne', () => {
    it('returns the file when it exists', async () => {
      const { file } = await service.create(buildCreateDto());
      const found = await service.findOne(file.id);
      expect(found.id).toBe(file.id);
    });

    it('throws NotFoundException when the file is missing', async () => {
      await expect(
        service.findOne('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
  // </function>

  // <function name="remove">
  describe('remove', () => {
    it('deletes the S3 object and the database row', async () => {
      const { file } = await service.create(buildCreateDto());

      await service.remove(file.id);

      const [deleteCommand] = s3Send.mock.calls.at(-1)! as [unknown];
      expect(deleteCommand).toBeInstanceOf(DeleteObjectCommand);
      const persisted = await orm.em.fork().findOne(File, { id: file.id });
      expect(persisted).toBeNull();
    });

    it('throws NotFoundException when the file is missing', async () => {
      await expect(
        service.remove('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
  // </function>
  // </functions>
});
