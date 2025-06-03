<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250511153947 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS favorite_photos (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS favorite_photos_user (favorite_photos_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_D99B21EBC91179F0 (favorite_photos_id), INDEX IDX_D99B21EBA76ED395 (user_id), PRIMARY KEY(favorite_photos_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS favorite_photos_photo (favorite_photos_id INT NOT NULL, photo_id INT NOT NULL, INDEX IDX_2C3B4E2BC91179F0 (favorite_photos_id), INDEX IDX_2C3B4E2B7E9E4C8C (photo_id), PRIMARY KEY(favorite_photos_id, photo_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        
        // Add foreign keys only if they don't exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_D99B21EBC91179F0' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photos_user ADD CONSTRAINT FK_D99B21EBC91179F0 FOREIGN KEY (favorite_photos_id) REFERENCES favorite_photos (id) ON DELETE CASCADE', 'SELECT "Foreign key FK_D99B21EBC91179F0 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_D99B21EBA76ED395' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photos_user ADD CONSTRAINT FK_D99B21EBA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE', 'SELECT "Foreign key FK_D99B21EBA76ED395 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_2C3B4E2BC91179F0' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photos_photo ADD CONSTRAINT FK_2C3B4E2BC91179F0 FOREIGN KEY (favorite_photos_id) REFERENCES favorite_photos (id) ON DELETE CASCADE', 'SELECT "Foreign key FK_2C3B4E2BC91179F0 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_2C3B4E2B7E9E4C8C' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photos_photo ADD CONSTRAINT FK_2C3B4E2B7E9E4C8C FOREIGN KEY (photo_id) REFERENCES photo (id) ON DELETE CASCADE', 'SELECT "Foreign key FK_2C3B4E2B7E9E4C8C already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user DROP FOREIGN KEY FK_D99B21EBC91179F0
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user DROP FOREIGN KEY FK_D99B21EBA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo DROP FOREIGN KEY FK_2C3B4E2BC91179F0
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo DROP FOREIGN KEY FK_2C3B4E2B7E9E4C8C
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos_photo
        SQL);
    }
}
