import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm'

import { CommonEntity } from '~/common/entity/common.entity'
import { UserEntity } from '~/modules/user/user.entity'

@Entity({ name: 'sys_user_oauth_providers' })
export class OAuthProviderEntity extends CommonEntity {
  @Column({ name: 'provider', type: 'varchar', length: 50 })
  provider: string // 'google', 'apple', 'github', etc.

  @Column({ name: 'provider_user_id', unique: false })
  providerUserId: string // OAuth provider's user ID

  @Column({ name: 'access_token', type: 'text', nullable: true })
  accessToken: string

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string

  @Column({ name: 'token_expires_at', type: 'timestamp', nullable: true })
  tokenExpiresAt: Date

  @Column({ name: 'provider_email', nullable: true })
  providerEmail: string

  @Column({ name: 'provider_name', nullable: true })
  providerName: string

  @Column({ name: 'provider_avatar', nullable: true })
  providerAvatar: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserEntity>

  @Column({ name: 'user_id' })
  userId: number
}
