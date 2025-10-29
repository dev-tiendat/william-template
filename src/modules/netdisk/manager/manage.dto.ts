import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { isEmpty } from 'lodash'

import { NETDISK_HANDLE_MAX_ITEM } from '~/constants/oss.constant'

@ValidatorConstraint({ name: 'IsLegalNameExpression', async: false })
export class IsLegalNameExpression implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    try {
      if (isEmpty(value))
        throw new Error('Directory name is empty')

      if (value.includes('/'))
        throw new Error('Directory name cannot contain /')

      return true
    }
    catch (e) {
      return false
    }
  }

  defaultMessage(_args: ValidationArguments) {
    return 'File or directory name is invalid'
  }
}

export class FileOpItem {
  @ApiProperty({ description: 'File type', enum: ['file', 'dir'] })
  @IsString()
  @Matches(/(^file$)|(^dir$)/)
  type: string

  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsLegalNameExpression)
  name: string
}

export class GetFileListDto {
  @ApiProperty({ description: 'Pagination marker' })
  @IsOptional()
  @IsString()
  marker: string

  @ApiProperty({ description: 'Current path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Search keyword' })
  @Validate(IsLegalNameExpression)
  @ValidateIf(o => !isEmpty(o.key))
  @IsString()
  key: string
}

export class MKDirDto {
  @ApiProperty({ description: 'Folder name' })
  @IsNotEmpty()
  @IsString()
  @Validate(IsLegalNameExpression)
  dirName: string

  @ApiProperty({ description: 'Parent path' })
  @IsString()
  path: string
}

export class RenameDto {
  @ApiProperty({ description: 'File type' })
  @IsString()
  @Matches(/(^file$)|(^dir$)/)
  type: string

  @ApiProperty({ description: 'New name' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsLegalNameExpression)
  toName: string

  @ApiProperty({ description: 'Original name' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsLegalNameExpression)
  name: string

  @ApiProperty({ description: 'Path' })
  @IsString()
  path: string
}

export class FileInfoDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsLegalNameExpression)
  name: string

  @ApiProperty({ description: 'File path' })
  @IsString()
  path: string
}

export class DeleteDto {
  @ApiProperty({ description: 'Files or folders to operate', type: [FileOpItem] })
  @Type(() => FileOpItem)
  @ArrayMaxSize(NETDISK_HANDLE_MAX_ITEM)
  @ValidateNested({ each: true })
  files: FileOpItem[]

  @ApiProperty({ description: 'Directory path' })
  @IsString()
  path: string
}

export class MarkFileDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  @Validate(IsLegalNameExpression)
  name: string

  @ApiProperty({ description: 'File path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Remark information' })
  @IsString()
  mark: string
}

export class FileOpDto {
  @ApiProperty({ description: 'Files or folders to operate', type: [FileOpItem] })
  @Type(() => FileOpItem)
  @ArrayMaxSize(NETDISK_HANDLE_MAX_ITEM)
  @ValidateNested({ each: true })
  files: FileOpItem[]

  @ApiProperty({ description: 'Source directory' })
  @IsString()
  originPath: string

  @ApiProperty({ description: 'Target directory' })
  @IsString()
  toPath: string
}
