<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250512105508 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS invitation (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, inivted_user_id INT DEFAULT NULL, invited_by_id INT DEFAULT NULL, email VARCHAR(255) DEFAULT NULL, status VARCHAR(255) DEFAULT NULL, created_at DATETIME DEFAULT NULL, token VARCHAR(255) DEFAULT NULL, INDEX IDX_F11D61A271F7E88B (event_id), INDEX IDX_F11D61A22876AC0C (inivted_user_id), INDEX IDX_F11D61A2A7B4A7E3 (invited_by_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        
        // Add foreign keys only if they don't exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_F11D61A271F7E88B' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A271F7E88B FOREIGN KEY (event_id) REFERENCES event (id)', 'SELECT "Foreign key FK_F11D61A271F7E88B already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_F11D61A22876AC0C' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A22876AC0C FOREIGN KEY (inivted_user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_F11D61A22876AC0C already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_F11D61A2A7B4A7E3' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2A7B4A7E3 FOREIGN KEY (invited_by_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_F11D61A2A7B4A7E3 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A271F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A22876AC0C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A2A7B4A7E3
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE invitation
        SQL);
    }
}
