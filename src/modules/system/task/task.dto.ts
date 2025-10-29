import { BadRequestException } from '@nestjs/common'
import { ApiProperty, ApiPropertyOptional, IntersectionType, PartialType } from '@nestjs/swagger'
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { CronExpressionParser } from 'cron-parser';
import { isEmpty } from 'lodash'

import { PagerDto } from '~/common/dto/pager.dto'
import { IsUnique } from '~/shared/database/constraints/unique.constraint'

import { TaskEntity } from './task.entity'

// Cron expression validation, bull lib references cron-parser
@ValidatorConstraint({ name: 'isCronExpression', async: false })
export class IsCronExpression implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    try {
      if (isEmpty(value))
        throw new BadRequestException('Cron expression is empty')

      CronExpressionParser.parse(value)
      return true
    }
    catch (e) {
      return false
    }
  }

  defaultMessage(_args: ValidationArguments) {
    return 'This cron expression ($value) is invalid'
  }
}

export class TaskDto {
  @ApiProperty({ description: 'Task name' })
  @IsUnique({ entity: TaskEntity, message: 'Task name already exists' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string

  @ApiProperty({ description: 'Service to call' })
  @IsString()
  @MinLength(1)
  service: string

  @ApiProperty({ description: 'Task type: cron | interval' })
  @IsIn([0, 1])
  type: number

  @ApiProperty({ description: 'Task status' })
  @IsIn([0, 1])
  status: number

  @ApiPropertyOptional({ description: 'Start time', type: Date })
  @IsDateString()
  @ValidateIf(o => !isEmpty(o.startTime))
  startTime: string

  @ApiPropertyOptional({ description: 'End time', type: Date })
  @IsDateString()
  @ValidateIf(o => !isEmpty(o.endTime))
  endTime: string

  @ApiPropertyOptional({
    description: 'Limit execution count, negative means unlimited',
  })
  @IsOptional()
  @IsInt()
  limit?: number = -1

  @ApiProperty({ description: 'Cron expression' })
  @Validate(IsCronExpression)
  @ValidateIf(o => o.type === 0)
  cron: string

  @ApiProperty({ description: 'Execution interval in milliseconds' })
  @IsInt()
  @Min(100)
  @ValidateIf(o => o.type === 1)
  every?: number

  @ApiPropertyOptional({ description: 'Execution parameters' })
  @IsOptional()
  @IsString()
  data?: string

  @ApiPropertyOptional({ description: 'Task remark' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class TaskUpdateDto extends PartialType(TaskDto) {}

export class TaskQueryDto extends IntersectionType(PagerDto, PartialType(TaskDto)) {}
