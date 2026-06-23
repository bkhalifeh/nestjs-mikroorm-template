import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ApiController } from '../../../common/decorators/api-controller.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/types/jwt-user.type';

import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserDto } from '../dto/user.dto';
import { ListUserQueryDto } from '../dto/list-user.dto';
import { UserRole } from '../enums/user-role.enum';

import { CreateUserResponse } from '../responses/create-user.response';
import { ListUserResponse } from '../responses/list-user.response';
import { DetailUserResponse } from '../responses/detail-user.response';
import { UpdateUserResponse } from '../responses/update-user.response';
import { DeleteUserResponse } from '../responses/delete-user.response';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiController({ options: 'users' })
export class UserController {
  constructor(
    // <properties>
    // <property name="userService">
    private readonly userService: UserService,
    // </property>
    // </properties>
  ) {}

  // <routes>

  // <route name="me">
  @ApiOperation({ summary: 'Get the currently-authenticated user.' })
  @ApiOkResponse({ type: DetailUserResponse })
  @Get('me')
  async me(@CurrentUser() user: JwtUser): Promise<DetailUserResponse> {
    const data = await this.userService.findOne(user.id);
    return new DetailUserResponse(data);
  }
  // </route>

  // <route name="updateProfile">
  @ApiOperation({ summary: 'Update the current user’s profile.' })
  @ApiOkResponse({ type: UpdateUserResponse })
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UpdateUserResponse> {
    const data = await this.userService.updateProfile(user.id, dto);
    return new UpdateUserResponse(data);
  }
  // </route>

  // <route name="create">
  @ApiOperation({ summary: 'Admin: create a new user.' })
  @ApiCreatedResponse({ type: CreateUserResponse })
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CreateUserResponse> {
    const data = await this.userService.create(createUserDto);
    return new CreateUserResponse(data);
  }
  // </route>

  // <route name="findAll">
  @ApiOperation({ summary: 'Admin: list users.' })
  @ApiOkResponse({ type: ListUserResponse })
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Query() query: ListUserQueryDto): Promise<ListUserResponse> {
    const [items, total] = await this.userService.findAll(query);
    return new ListUserResponse(items, total, {
      page: query.page,
      perPage: query.perPage,
    });
  }
  // </route>

  // <route name="findOne">
  @ApiOperation({ summary: 'Admin: fetch a user by id.' })
  @ApiOkResponse({ type: DetailUserResponse })
  @Roles(UserRole.ADMIN)
  @Get(':id')
  async findOne(@Param() params: UserDto): Promise<DetailUserResponse> {
    const data = await this.userService.findOne(params.id);
    return new DetailUserResponse(data);
  }
  // </route>

  // <route name="update">
  @ApiOperation({ summary: 'Admin: patch a user.' })
  @ApiOkResponse({ type: UpdateUserResponse })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param() params: UserDto,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponse> {
    const data = await this.userService.update(params.id, updateUserDto);
    return new UpdateUserResponse(data);
  }
  // </route>

  // <route name="remove">
  @ApiOperation({ summary: 'Admin: delete a user.' })
  @ApiOkResponse({ type: DeleteUserResponse })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  async remove(@Param() params: UserDto): Promise<DeleteUserResponse> {
    await this.userService.remove(params.id);
    return new DeleteUserResponse({});
  }
  // </route>
  // </routes>
}
