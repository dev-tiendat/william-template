import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPasswordResetOtp1700000000001 implements MigrationInterface {
  name = 'AddPasswordResetOtp1700000000001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create password reset OTP table
    await queryRunner.query(`
      CREATE TABLE \`sys_password_reset_otp\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`email\` varchar(255) NOT NULL COMMENT 'User email address',
        \`otp\` varchar(5) NOT NULL COMMENT '5-digit OTP code',
        \`expires_at\` datetime NOT NULL COMMENT 'OTP expiration time',
        \`is_used\` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether OTP has been used',
        \`used_at\` datetime NULL COMMENT 'When OTP was used',
        \`ip_address\` varchar(45) NULL COMMENT 'IP address of requester',
        \`user_agent\` text NULL COMMENT 'User agent of requester',
        \`attempts\` int NOT NULL DEFAULT '0' COMMENT 'Number of verification attempts',
        PRIMARY KEY (\`id\`),
        INDEX \`idx_otp_email\` (\`email\`),
        INDEX \`idx_otp_email_otp\` (\`email\`, \`otp\`),
        INDEX \`idx_otp_expires\` (\`expires_at\`),
        INDEX \`idx_otp_created\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Password reset OTP codes';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop password reset OTP table
    await queryRunner.query(`DROP TABLE IF EXISTS \`sys_password_reset_otp\``)
  }
}
