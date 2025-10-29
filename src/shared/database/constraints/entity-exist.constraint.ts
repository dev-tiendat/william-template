import { Injectable } from '@nestjs/common'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { DataSource, ObjectType, Repository } from 'typeorm'

interface Condition {
  entity: ObjectType<any>

  field?: string
}

@ValidatorConstraint({ name: 'entityItemExist', async: true })
@Injectable()
export class EntityExistConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) { }

  async validate(value: string, args: ValidationArguments) {
    let repo: Repository<any>

    if (!value)
      return true

    let field = 'id'

    if ('entity' in args.constraints[0]) {
      field = args.constraints[0].field ?? 'id'
      repo = this.dataSource.getRepository(args.constraints[0].entity)
    }
    else {
      repo = this.dataSource.getRepository(args.constraints[0])
    }

    const item = await repo.findOne({ where: { [field]: value } })
    return !!item
  }

  defaultMessage(args: ValidationArguments) {
    if (!args.constraints[0])
      return 'Model not been specified!'

    return `All instance of ${args.constraints[0].name} must been exists in database!`
  }
}

function IsEntityExist(
  entity: ObjectType<any>,
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void

function IsEntityExist(
  condition: { entity: ObjectType<any>, field?: string },
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void

function IsEntityExist(
  condition: ObjectType<any> | { entity: ObjectType<any>, field?: string },
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [condition],
      validator: EntityExistConstraint,
    })
  }
}

export { IsEntityExist }
