import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ApiController } from '../../../common/decorators/api-controller.decorator';
import { FileService } from '../services/file.service';
import { CreateFileDto } from '../dto/create-file.dto';
import { FileDto } from '../dto/file.dto';
import { ListFileQueryDto } from '../dto/list-file.dto';
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

@ApiController({ options: 'files' })
export class FileController {
  constructor(
    // <properties>
    // <property name="fileService">
    private readonly fileService: FileService,
    // </property>
    // </properties>
  ) {}

  // <routes>

  // <route name="create">
  @ApiOperation({
    summary: 'Request a pre-signed URL the client should PUT the file body to.',
  })
  @ApiCreatedResponse({ type: PresignedUploadResponse })
  @Post()
  async create(
    // <arguments>
    // <argument name="createFileDto">
    @Body() createFileDto: CreateFileDto,
    // </argument>
    // </arguments>
  ): Promise<PresignedUploadResponse> {
    const data = await this.fileService.create(createFileDto);
    return new PresignedUploadResponse(new PresignedUploadData(data));
  }
  // </route>

  // <route name="confirm">
  @ApiOperation({
    summary:
      'Confirm that the client finished uploading; verifies the object in S3 and marks the row as uploaded.',
  })
  @ApiOkResponse({ type: ConfirmFileResponse })
  @HttpCode(HttpStatus.OK)
  @Post(':id/confirm')
  async confirm(
    // <arguments>
    // <argument name="params">
    @Param() params: FileDto,
    // </argument>
    // </arguments>
  ): Promise<ConfirmFileResponse> {
    const data = await this.fileService.confirm(params.id);
    return new ConfirmFileResponse(data);
  }
  // </route>

  // <route name="getDownloadUrl">
  @ApiOperation({
    summary: 'Get a pre-signed URL the client should GET to download the file.',
  })
  @ApiOkResponse({ type: PresignedDownloadResponse })
  @Get(':id/download-url')
  async getDownloadUrl(
    // <arguments>
    // <argument name="params">
    @Param() params: FileDto,
    // </argument>
    // </arguments>
  ): Promise<PresignedDownloadResponse> {
    const data = await this.fileService.getDownloadUrl(params.id);
    return new PresignedDownloadResponse(new PresignedDownloadData(data));
  }
  // </route>

  // <route name="findAll">
  @ApiOkResponse({ type: ListFileResponse })
  @Get()
  async findAll(
    // <arguments>
    // <argument name="query">
    @Query() query: ListFileQueryDto,
    // </argument>
    // </arguments>
  ): Promise<ListFileResponse> {
    const [items, total] = await this.fileService.findAll(query);
    return new ListFileResponse(items, total, {
      page: query.page,
      perPage: query.perPage,
    });
  }
  // </route>

  // <route name="findOne">
  @ApiOkResponse({ type: DetailFileResponse })
  @Get(':id')
  async findOne(
    // <arguments>
    // <argument name="params">
    @Param() params: FileDto,
    // </argument>
    // </arguments>
  ): Promise<DetailFileResponse> {
    const data = await this.fileService.findOne(params.id);
    return new DetailFileResponse(data);
  }
  // </route>

  // <route name="remove">
  @ApiOkResponse({ type: DeleteFileResponse })
  @Delete(':id')
  async remove(
    // <arguments>
    // <argument name="params">
    @Param() params: FileDto,
    // </argument>
    // </arguments>
  ): Promise<DeleteFileResponse> {
    await this.fileService.remove(params.id);
    return new DeleteFileResponse({});
  }
  // </route>
  // </routes>
}
