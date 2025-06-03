<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250511155222 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS favorite_photo (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, photo_id INT NOT NULL, upload_date DATETIME NOT NULL, INDEX IDX_A23FAF3CA76ED395 (user_id), INDEX IDX_A23FAF3C7E9E4C8C (photo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        
        // Add foreign keys only if they don't exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_A23FAF3CA76ED395' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photo ADD CONSTRAINT FK_A23FAF3CA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_A23FAF3CA76ED395 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_A23FAF3C7E9E4C8C' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE favorite_photo ADD CONSTRAINT FK_A23FAF3C7E9E4C8C FOREIGN KEY (photo_id) REFERENCES photo (id)', 'SELECT "Foreign key FK_A23FAF3C7E9E4C8C already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photo DROP FOREIGN KEY FK_A23FAF3CA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photo DROP FOREIGN KEY FK_A23FAF3C7E9E4C8C
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photo
        SQL);
    }
}
