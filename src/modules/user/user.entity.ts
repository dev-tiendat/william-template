import { Exclude } from 'class-transformer'
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  Relation,
} from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'

import {
  ExperienceLevel,
  GenderType,
  SportType,
  TrainingGoals,
  UserStatus,
} from '~/database/enums/users.enum'

import { AccessTokenEntity } from '~/modules/auth/entities/access-token.entity'
import { OAuthProviderEntity } from '~/modules/auth/entities/oauth-provider.entity'

import { RoleEntity } from '~/modules/system/role/role.entity'

@Entity({ name: 'users' })
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_firebase_uid', ['firebaseUid'], { unique: true })
@Index('idx_users_status', ['status'])
export class UserEntity extends CommonEntity {
  @Column({ unique: true })
  email: string

  @Exclude()
  @Column()
  password: string

  @Column({ length: 32 })
  psalt: string

  @Column({
    name: 'firebase_uid',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  firebaseUid: string

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus

  @Column({
    name: 'full_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  fullName: string

  @Column({
    name: 'date_of_birth',
    type: 'date',
    nullable: true,
  })
  dateOfBirth: Date

  @Column({
    name: 'gender',
    type: 'enum',
    enum: GenderType,
    nullable: true,
  })
  gender: GenderType

  @Column({
    name: 'height',
    type: 'integer',
    nullable: true,
  })
  height: number

  @Column({
    name: 'weight',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weight: number

  @Column({
    name: 'weight_class',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weightClass: number

  @Column({
    name: 'sport_type',
    type: 'enum',
    enum: SportType,
    array: true,
    nullable: true,
  })
  sportType: SportType[]

  @Column({
    name: 'training_goals',
    type: 'enum',
    enum: TrainingGoals,
    nullable: true,
  })
  trainingGoals: TrainingGoals

  @Column({
    name: 'experience_level',
    type: 'enum',
    enum: ExperienceLevel,
    nullable: true,
  })
  experienceLevel: ExperienceLevel

  @Column({
    name: 'avatar_url',
    type: 'text',
    nullable: true,
  })
  avatarUrl: string

  @ManyToMany(() => RoleEntity, role => role.users)
  @JoinTable({
    name: 'sys_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Relation<RoleEntity[]>

  @OneToMany(() => AccessTokenEntity, accessToken => accessToken.user, {
    cascade: true,
  })
  accessTokens: Relation<AccessTokenEntity[]>

  @OneToMany(() => OAuthProviderEntity, oauthProvider => oauthProvider.user, {
    cascade: true,
  })
  oauthProviders: Relation<OAuthProviderEntity[]>
}
