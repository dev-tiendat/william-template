import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { AuthUser } from '~/modules/auth/decorators/auth-user.decorator'

import { definePermission, Perm } from '~/modules/auth/decorators/permission.decorator'

import { checkIsDemoMode } from '~/utils'

import { SFileInfoDetail, SFileList, UploadToken } from './manage.class'
import {
  DeleteDto,
  FileInfoDto,
  FileOpDto,
  GetFileListDto,
  MarkFileDto,
  MKDirDto,
  RenameDto,
} from './manage.dto'
import { NetDiskManageService } from './manage.service'

export const permissions = definePermission('netdisk:manage', {
  LIST: 'list',
  CREATE: 'create',
  INFO: 'info',
  UPDATE: 'update',
  DELETE: 'delete',
  MKDIR: 'mkdir',
  TOKEN: 'token',
  MARK: 'mark',
  DOWNLOAD: 'download',
  RENAME: 'rename',
  CUT: 'cut',
  COPY: 'copy',
} as const)

@ApiTags('NetDiskManage - NetDisk Management Module')
@Controller('manage')
export class NetDiskManageController {
  constructor(private manageService: NetDiskManageService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get file list' })
  @ApiOkResponse({ type: SFileList })
  @Perm(permissions.LIST)
  async list(@Query() dto: GetFileListDto): Promise<SFileList> {
    return await this.manageService.getFileList(dto.path, dto.marker, dto.key)
  }

  @Post('mkdir')
  @ApiOperation({ summary: 'Create folder, supports multi-level' })
  @Perm(permissions.MKDIR)
  async mkdir(@Body() dto: MKDirDto): Promise<void> {
    const result = await this.manageService.checkFileExist(
      `${dto.path}${dto.dirName}/`,
    )
    if (result)
      throw new BusinessException(ErrorEnum.OSS_FILE_OR_DIR_EXIST)

    await this.manageService.createDir(`${dto.path}${dto.dirName}`)
  }

  @Get('token')
  @ApiOperation({ summary: 'Get upload token, frontend cannot upload without token' })
  @ApiOkResponse({ type: UploadToken })
  @Perm(permissions.TOKEN)
  async token(@AuthUser() user: IAuthUser): Promise<UploadToken> {
    checkIsDemoMode()

    return {
      token: this.manageService.createUploadToken(`${user.uid}`),
    }
  }

  @Get('info')
  @ApiOperation({ summary: 'Get file detailed information' })
  @ApiOkResponse({ type: SFileInfoDetail })
  @Perm(permissions.INFO)
  async info(@Query() dto: FileInfoDto): Promise<SFileInfoDetail> {
    return await this.manageService.getFileInfo(dto.name, dto.path)
  }

  @Post('mark')
  @ApiOperation({ summary: 'Add file remark' })
  @Perm(permissions.MARK)
  async mark(@Body() dto: MarkFileDto): Promise<void> {
    await this.manageService.changeFileHeaders(dto.name, dto.path, {
      mark: dto.mark,
    })
  }

  @Get('download')
  @ApiOperation({ summary: 'Get download link, does not support downloading folders' })
  @ApiOkResponse({ type: String })
  @Perm(permissions.DOWNLOAD)
  async download(@Query() dto: FileInfoDto): Promise<string> {
    return this.manageService.getDownloadLink(`${dto.path}${dto.name}`)
  }

  @Post('rename')
  @ApiOperation({ summary: 'Rename file or folder' })
  @Perm(permissions.RENAME)
  async rename(@Body() dto: RenameDto): Promise<void> {
    const result = await this.manageService.checkFileExist(
      `${dto.path}${dto.toName}${dto.type === 'dir' ? '/' : ''}`,
    )
    if (result)
      throw new BusinessException(ErrorEnum.OSS_FILE_OR_DIR_EXIST)

    if (dto.type === 'file')
      await this.manageService.renameFile(dto.path, dto.name, dto.toName)
    else
      await this.manageService.renameDir(dto.path, dto.name, dto.toName)
  }

  @Post('delete')
  @ApiOperation({ summary: 'Delete file or folder' })
  @Perm(permissions.DELETE)
  async delete(@Body() dto: DeleteDto): Promise<void> {
    await this.manageService.deleteMultiFileOrDir(dto.files, dto.path)
  }

  @Post('cut')
  @ApiOperation({ summary: 'Cut file or folder, supports batch' })
  @Perm(permissions.CUT)
  async cut(@Body() dto: FileOpDto): Promise<void> {
    if (dto.originPath === dto.toPath)
      throw new BusinessException(ErrorEnum.OSS_NO_OPERATION_REQUIRED)

    await this.manageService.moveMultiFileOrDir(
      dto.files,
      dto.originPath,
      dto.toPath,
    )
  }

  @Post('copy')
  @ApiOperation({ summary: 'Copy file or folder, supports batch' })
  @Perm(permissions.COPY)
  async copy(@Body() dto: FileOpDto): Promise<void> {
    await this.manageService.copyMultiFileOrDir(
      dto.files,
      dto.originPath,
      dto.toPath,
    )
  }
}
