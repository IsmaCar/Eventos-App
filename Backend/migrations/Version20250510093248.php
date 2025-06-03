<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250510093248 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        // Check if banned column already exists in event table before adding it
        $this->addSql(<<<'SQL'
            SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event' AND COLUMN_NAME = 'banned');
            SET @sql = IF(@column_exists = 0, 'ALTER TABLE event ADD banned TINYINT(1) NOT NULL', 'SELECT "Column banned already exists in event table"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        // Check if banned column already exists in user table before adding it
        $this->addSql(<<<'SQL'
            SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'banned');
            SET @sql = IF(@column_exists = 0, 'ALTER TABLE user ADD banned TINYINT(1) NOT NULL', 'SELECT "Column banned already exists in user table"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE event DROP banned
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE `user` DROP banned
        SQL);
    }
}
