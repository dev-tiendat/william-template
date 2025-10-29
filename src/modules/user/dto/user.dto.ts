import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

import { PagerDto } from '~/common/dto/pager.dto'
import {
  ExperienceLevel,
  GenderType,
  SportType,
  TrainingGoals,
  UserStatus,
} from '~/database/enums/users.enum'

export class UserDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ description: 'Login password', example: 'a123456' })
  @IsOptional()
  @Matches(/^\S*(?=\S{6})(?=\S*\d)(?=\S*[A-Z])\S*$/i, {
    message: 'Password must contain numbers and letters, length 6-16',
  })
  password: string

  @ApiProperty({ description: 'Assigned role', type: [Number] })
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  roleIds: number[]

  @ApiProperty({ description: 'Firebase UID' })
  @IsOptional()
  @IsString()
  firebaseUid?: string

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string

  @ApiProperty({ description: 'Date of birth' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date

  @ApiProperty({ description: 'Gender', enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType

  @ApiProperty({ description: 'Height in cm', example: 180 })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(300)
  height?: number

  @ApiProperty({ description: 'Weight in kg', example: 75.5 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weight?: number

  @ApiProperty({ description: 'Weight class in kg', example: 77 })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weightClass?: number

  @ApiProperty({ description: 'Sport types', enum: SportType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(SportType, { each: true })
  sportType?: SportType[]

  @ApiProperty({ description: 'Training goals', enum: TrainingGoals })
  @IsOptional()
  @IsEnum(TrainingGoals)
  trainingGoals?: TrainingGoals

  @ApiProperty({ description: 'Experience level', enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel

  @ApiProperty({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string

  @ApiProperty({ description: 'Status', enum: UserStatus })
  @IsEnum(UserStatus)
  status: UserStatus
}

export class UserUpdateDto extends PartialType(UserDto) {}

export class UserQueryDto extends IntersectionType(PagerDto<UserDto>, PartialType(UserDto)) {
  @ApiProperty({ description: 'Status', enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus
}
