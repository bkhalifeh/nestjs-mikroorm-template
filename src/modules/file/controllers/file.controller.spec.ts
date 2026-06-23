import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
// <imports>
// <import name="FileController">
import { FileController } from './file.controller';
// </import>
// <import name="FileService">
import { FileService } from '../services/file.service';
// </import>
// <import name="File">
import { File } from '../domains/file';
// </import>
// <import name="FileStatus">
import { FileStatus } from '../enums/file-status.enum';
// </import>
// <import name="responses">
import {
  PresignedUploadData,
  PresignedUploadResponse,
} from '../responses/presigned-upload.response';
import {
  PresignedDownloadData,
  PresignedDownloadResponse,
} from '../responses/presigned-download.response';
import { ConfirmFileResponse } from '../responses/confirm-file.response';
import { DetailFileResponse } from '../responses/detail-file.response';
import { ListFileResponse } from '../responses/list-file.response';
import { DeleteFileResponse } from '../responses/delete-file.response';
// </import>
// </imports>

function buildFile(id = '00000000-0000-0000-0000-000000000001'): File {
  const entity = new File();
  entity.id = id;
  entity.createdAt = new Date('2026-01-01T00:00:00Z');
  entity.updatedAt = new Date('2026-01-01T00:00:00Z');
  entity.key = `uploads/2026/01/01/${id}.png`;
  entity.originalName = 'cat.png';
  entity.mimeType = 'image/png';
  entity.size = 1024;
  entity.status = FileStatus.PENDING;
  entity.uploadedAt = null;
  return entity;
}

describe('FileController', () => {
  let controller: FileController;
  let service: Partial<Record<keyof FileService, ReturnType<typeof vi.fn>>>;

  beforeEach(async () => {
    service = {
      // <mocks>
      // <mock name="create">
      create: vi.fn(),
      // </mock>
      // <mock name="confirm">
      confirm: vi.fn(),
      // </mock>
      // <mock name="getDownloadUrl">
      getDownloadUrl: vi.fn(),
      // </mock>
      // <mock name="findAll">
      findAll: vi.fn(),
      // </mock>
      // <mock name="findOne">
      findOne: vi.fn(),
      // </mock>
      // <mock name="remove">
      remove: vi.fn(),
      // </mock>
      // </mocks>
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        // <providers>
        // <provider name="FileService">
        { provide: FileService, useValue: service },
        // </provider>
        // </providers>
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // <routes>
  // <route name="create">
  describe('create', () => {
    it('delegates to FileService.create and wraps the result as a PresignedUploadResponse', async () => {
      const file = buildFile();
      const expiresAt = new Date('2026-01-01T00:15:00Z');
      const dto = {
        originalName: 'cat.png',
        mimeType: 'image/png',
        size: 1024,
      } as never;
      service.create!.mockResolvedValue({
        file,
        url: 'https://signed.example.com/upload',
        headers: { 'Content-Type': 'image/png', 'Content-Length': '1024' },
        expiresIn: 900,
        expiresAt,
      });

      const response = await controller.create(dto);

      expect(service.create).toHaveBeenCalledExactlyOnceWith(dto);
      expect(response).toBeInstanceOf(PresignedUploadResponse);
      expect(response.data).toBeInstanceOf(PresignedUploadData);
      expect(response.data.file).toBe(file);
      expect(response.data.url).toBe('https://signed.example.com/upload');
      expect(response.data.method).toBe('PUT');
      expect(response.data.headers['Content-Type']).toBe('image/png');
      expect(response.data.expiresIn).toBe(900);
      expect(response.data.expiresAt).toBe(expiresAt.toISOString());
    });
  });
  // </route>

  // <route name="confirm">
  describe('confirm', () => {
    it('passes the id through and wraps the result as a ConfirmFileResponse', async () => {
      const file = buildFile('abc');
      service.confirm!.mockResolvedValue(file);

      const response = await controller.confirm({ id: 'abc' });

      expect(service.confirm).toHaveBeenCalledExactlyOnceWith('abc');
      expect(response).toBeInstanceOf(ConfirmFileResponse);
      expect(response.data).toBe(file);
    });

    it('propagates errors thrown by the service', async () => {
      const error = new Error('upload not found');
      service.confirm!.mockRejectedValue(error);

      await expect(controller.confirm({ id: 'missing' })).rejects.toBe(error);
    });
  });
  // </route>

  // <route name="getDownloadUrl">
  describe('getDownloadUrl', () => {
    it('wraps a presigned download in a PresignedDownloadResponse', async () => {
      const file = buildFile('xyz');
      const expiresAt = new Date('2026-01-01T00:15:00Z');
      service.getDownloadUrl!.mockResolvedValue({
        file,
        url: 'https://signed.example.com/download',
        expiresIn: 900,
        expiresAt,
      });

      const response = await controller.getDownloadUrl({ id: 'xyz' });

      expect(service.getDownloadUrl).toHaveBeenCalledExactlyOnceWith('xyz');
      expect(response).toBeInstanceOf(PresignedDownloadResponse);
      expect(response.data).toBeInstanceOf(PresignedDownloadData);
      expect(response.data.method).toBe('GET');
      expect(response.data.url).toBe('https://signed.example.com/download');
      expect(response.data.expiresAt).toBe(expiresAt.toISOString());
    });
  });
  // </route>

  // <route name="findAll">
  describe('findAll', () => {
    it('delegates to FileService.findAll and wraps the page', async () => {
      const files = [buildFile('a'), buildFile('b')];
      const query = { page: 1, perPage: 20 };
      service.findAll!.mockResolvedValue([files, 2]);

      const response = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledExactlyOnceWith(query);
      expect(response).toBeInstanceOf(ListFileResponse);
      expect(response.data.items).toBe(files);
      expect(response.meta.total).toBe(2);
      expect(response.meta.currentPage).toBe(1);
      expect(response.meta.perPage).toBe(20);
      expect(response.meta.firstPage).toBe(1);
      expect(response.meta.lastPage).toBe(1);
    });

    it('returns an empty page when the service returns nothing', async () => {
      const query = { page: 1, perPage: 20 };
      service.findAll!.mockResolvedValue([[], 0]);

      const response = await controller.findAll(query);

      expect(response).toBeInstanceOf(ListFileResponse);
      expect(response.data.items).toEqual([]);
      expect(response.meta.total).toBe(0);
    });
  });
  // </route>

  // <route name="findOne">
  describe('findOne', () => {
    it('passes the id through and wraps the result', async () => {
      const file = buildFile('abc');
      service.findOne!.mockResolvedValue(file);

      const response = await controller.findOne({ id: 'abc' });

      expect(service.findOne).toHaveBeenCalledExactlyOnceWith('abc');
      expect(response).toBeInstanceOf(DetailFileResponse);
      expect(response.data).toBe(file);
    });

    it('propagates errors thrown by the service', async () => {
      const error = new Error('not found');
      service.findOne!.mockRejectedValue(error);

      await expect(controller.findOne({ id: 'missing' })).rejects.toBe(error);
    });
  });
  // </route>

  // <route name="remove">
  describe('remove', () => {
    it('calls FileService.remove and returns a DeleteFileResponse', async () => {
      service.remove!.mockResolvedValue(undefined);

      const response = await controller.remove({ id: 'to-delete' });

      expect(service.remove).toHaveBeenCalledExactlyOnceWith('to-delete');
      expect(response).toBeInstanceOf(DeleteFileResponse);
      expect(response.data).toBeDefined();
    });

    it('propagates errors thrown by the service', async () => {
      const error = new Error('not found');
      service.remove!.mockRejectedValue(error);

      await expect(controller.remove({ id: 'missing' })).rejects.toBe(error);
    });
  });
  // </route>
  // </routes>
});
