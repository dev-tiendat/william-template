import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'

import { OAuthProviderEntity } from '../entities/oauth-provider.entity'

export interface IOAuthUser {
  provider: string
  providerId: string
  email: string
  name: string
  avatar?: string
  accessToken: string
  refreshToken?: string
}

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(OAuthProviderEntity)
    private oauthProviderRepository: Repository<OAuthProviderEntity>,
  ) {}

  /**
   * Find OAuth provider by provider name and provider user ID
   */
  async findOAuthProvider(
    provider: string,
    providerId: string,
  ): Promise<OAuthProviderEntity | null> {
    return this.oauthProviderRepository.findOne({
      where: {
        provider,
        providerUserId: providerId,
      },
      relations: ['user'],
    })
  }

  /**
   * Create or update OAuth provider for a user
   */
  async upsertOAuthProvider(
    userId: number,
    oauthData: IOAuthUser,
  ): Promise<OAuthProviderEntity> {
    const existingProvider = await this.oauthProviderRepository.findOne({
      where: {
        userId,
        provider: oauthData.provider,
      },
    })

    const providerData = {
      userId,
      provider: oauthData.provider,
      providerUserId: oauthData.providerId,
      accessToken: oauthData.accessToken,
      refreshToken: oauthData.refreshToken,
      providerEmail: oauthData.email,
      providerName: oauthData.name,
      providerAvatar: oauthData.avatar,
      tokenExpiresAt: null, // You can calculate this based on OAuth response
    }

    if (existingProvider) {
      // Update existing provider
      Object.assign(existingProvider, providerData)
      return this.oauthProviderRepository.save(existingProvider)
    }
    else {
      // Create new provider
      const newProvider = this.oauthProviderRepository.create(providerData)
      return this.oauthProviderRepository.save(newProvider)
    }
  }

  /**
   * Link OAuth provider to existing user
   */
  async linkOAuthProvider(userId: number, oauthData: IOAuthUser): Promise<void> {
    // Check if this OAuth account is already linked to another user
    const existingProvider = await this.findOAuthProvider(
      oauthData.provider,
      oauthData.providerId,
    )

    if (existingProvider && existingProvider.userId !== userId) {
      throw new BusinessException(ErrorEnum.OAUTH_ALREADY_LINKED)
    }

    await this.upsertOAuthProvider(userId, oauthData)
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: number, provider: string): Promise<void> {
    const result = await this.oauthProviderRepository.delete({
      userId,
      provider,
    })

    if (result.affected === 0) {
      throw new BusinessException(ErrorEnum.OAUTH_PROVIDER_NOT_FOUND)
    }
  }

  /**
   * Get all OAuth providers for a user
   */
  async getUserOAuthProviders(userId: number): Promise<OAuthProviderEntity[]> {
    return this.oauthProviderRepository.find({
      where: { userId },
      select: ['id', 'provider', 'providerEmail', 'providerName', 'providerAvatar', 'createdAt'],
    })
  }
}
