import { ApiProperty } from '@nestjs/swagger'
import {
  ExperienceLevel,
  GenderType,
  SportType,
  TrainingGoals,
  UserStatus,
} from '~/database/enums/users.enum'

export class AccountInfo {
  @ApiProperty({ description: 'Email' })
  email: string

  @ApiProperty({ description: 'Firebase UID' })
  firebaseUid?: string

  @ApiProperty({ description: 'Status' })
  status: UserStatus

  @ApiProperty({ description: 'Full name' })
  fullName?: string

  @ApiProperty({ description: 'Date of birth' })
  dateOfBirth?: Date

  @ApiProperty({ description: 'Gender' })
  gender?: GenderType

  @ApiProperty({ description: 'Height in cm' })
  height?: number

  @ApiProperty({ description: 'Weight in kg' })
  weight?: number

  @ApiProperty({ description: 'Weight class in kg' })
  weightClass?: number

  @ApiProperty({ description: 'Sport types' })
  sportType?: SportType[]

  @ApiProperty({ description: 'Training goals' })
  trainingGoals?: TrainingGoals

  @ApiProperty({ description: 'Experience level' })
  experienceLevel?: ExperienceLevel

  @ApiProperty({ description: 'Avatar URL' })
  avatarUrl?: string
}
