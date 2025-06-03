<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250427193758 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS comment (id INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, user_id INT NOT NULL, text VARCHAR(150) NOT NULL, date DATETIME NOT NULL, INDEX IDX_9474526C71F7E88B (event_id), INDEX IDX_9474526CA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS event (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, title VARCHAR(80) NOT NULL, description VARCHAR(255) NOT NULL, event_date DATE NOT NULL, INDEX IDX_3BAE0AA7A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS location (id INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, latitude DOUBLE PRECISION NOT NULL, length DOUBLE PRECISION NOT NULL, address VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_5E9E89CB71F7E88B (event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS photo (id INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, user_id INT NOT NULL, url_photo VARCHAR(255) NOT NULL, upload_date DATETIME NOT NULL, INDEX IDX_14B7841871F7E88B (event_id), INDEX IDX_14B78418A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        
        // Add foreign keys only if they don't exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_9474526C71F7E88B' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE comment ADD CONSTRAINT FK_9474526C71F7E88B FOREIGN KEY (event_id) REFERENCES event (id)', 'SELECT "Foreign key FK_9474526C71F7E88B already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_9474526CA76ED395' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE comment ADD CONSTRAINT FK_9474526CA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_9474526CA76ED395 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_3BAE0AA7A76ED395' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE event ADD CONSTRAINT FK_3BAE0AA7A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_3BAE0AA7A76ED395 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_5E9E89CB71F7E88B' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE location ADD CONSTRAINT FK_5E9E89CB71F7E88B FOREIGN KEY (event_id) REFERENCES event (id)', 'SELECT "Foreign key FK_5E9E89CB71F7E88B already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_14B7841871F7E88B' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE photo ADD CONSTRAINT FK_14B7841871F7E88B FOREIGN KEY (event_id) REFERENCES event (id)', 'SELECT "Foreign key FK_14B7841871F7E88B already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_14B78418A76ED395' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE photo ADD CONSTRAINT FK_14B78418A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_14B78418A76ED395 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE comment DROP FOREIGN KEY FK_9474526C71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE comment DROP FOREIGN KEY FK_9474526CA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE event DROP FOREIGN KEY FK_3BAE0AA7A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE location DROP FOREIGN KEY FK_5E9E89CB71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo DROP FOREIGN KEY FK_14B7841871F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo DROP FOREIGN KEY FK_14B78418A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE comment
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE event
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE location
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE photo
        SQL);
    }
}
