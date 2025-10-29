import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOAuthProviders1700000000000 implements MigrationInterface {
  name = 'AddOAuthProviders1700000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create oauth providers table
    await queryRunner.query(`
      CREATE TABLE \`sys_user_oauth_providers\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`provider\` varchar(50) NOT NULL COMMENT 'OAuth provider name (google, apple, github, etc.)',
        \`provider_user_id\` varchar(255) NOT NULL COMMENT 'OAuth provider user ID',
        \`access_token\` text NULL COMMENT 'OAuth access token',
        \`refresh_token\` text NULL COMMENT 'OAuth refresh token',
        \`token_expires_at\` datetime NULL COMMENT 'Token expiration timestamp',
        \`provider_email\` varchar(255) NULL COMMENT 'Email from OAuth provider',
        \`provider_name\` varchar(255) NULL COMMENT 'Name from OAuth provider',
        \`provider_avatar\` varchar(500) NULL COMMENT 'Avatar URL from OAuth provider',
        \`user_id\` int NOT NULL COMMENT 'Reference to sys_user.id',
        PRIMARY KEY (\`id\`),
        KEY \`idx_oauth_provider_user\` (\`provider\`, \`provider_user_id\`),
        KEY \`idx_oauth_user_id\` (\`user_id\`),
        UNIQUE KEY \`uk_oauth_provider_user\` (\`provider\`, \`provider_user_id\`),
        CONSTRAINT \`fk_oauth_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`sys_user\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OAuth provider accounts linked to users';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop oauth providers table
    await queryRunner.query(`DROP TABLE IF EXISTS \`sys_user_oauth_providers\``)
  }
}
