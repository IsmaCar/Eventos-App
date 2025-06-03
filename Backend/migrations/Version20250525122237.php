<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250525122237 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS friendship (id INT AUTO_INCREMENT NOT NULL, requester_id INT NOT NULL, addressee_id INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_7234A45FED442CF4 (requester_id), INDEX IDX_7234A45F2261B4C3 (addressee_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        
        // Add foreign keys only if they don't exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_7234A45FED442CF4' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE friendship ADD CONSTRAINT FK_7234A45FED442CF4 FOREIGN KEY (requester_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_7234A45FED442CF4 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_7234A45F2261B4C3' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE friendship ADD CONSTRAINT FK_7234A45F2261B4C3 FOREIGN KEY (addressee_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_7234A45F2261B4C3 already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        
        // Check if favorite_photos tables exist before dropping them
        $this->addSql(<<<'SQL'
            SET FOREIGN_KEY_CHECKS = 0
        SQL);
        
        $this->addSql(<<<'SQL'
            DROP TABLE IF EXISTS favorite_photos_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE IF EXISTS favorite_photos_photo
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE IF EXISTS favorite_photos
        SQL);
        
        $this->addSql(<<<'SQL'
            SET FOREIGN_KEY_CHECKS = 1
        SQL);
        
        // Conditionally add status column and change description size
        $this->addSql(<<<'SQL'
            SET @status_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event' AND COLUMN_NAME = 'status');
            SET @sql = IF(@status_exists = 0, 
                'ALTER TABLE event ADD status VARCHAR(20) NOT NULL, CHANGE description description VARCHAR(500) NOT NULL',
                'ALTER TABLE event CHANGE description description VARCHAR(500) NOT NULL'
            );
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        
        // Conditionally drop foreign key and index if they exist
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_F11D61A22876AC0C' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists > 0, 'ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A22876AC0C', 'SELECT "Foreign key FK_F11D61A22876AC0C does not exist"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invitation' AND INDEX_NAME = 'IDX_F11D61A22876AC0C');
            SET @sql = IF(@index_exists > 0, 'DROP INDEX IDX_F11D61A22876AC0C ON invitation', 'SELECT "Index IDX_F11D61A22876AC0C does not exist"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        
        // Change column names conditionally
        $this->addSql(<<<'SQL'
            SET @old_column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invitation' AND COLUMN_NAME = 'inivted_user_id');
            SET @sql = IF(@old_column_exists > 0, 
                'ALTER TABLE invitation CHANGE event_id event_id INT NOT NULL, CHANGE inivted_user_id invited_user_id INT DEFAULT NULL',
                'ALTER TABLE invitation CHANGE event_id event_id INT NOT NULL'
            );
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        
        // Add new foreign key and index
        $this->addSql(<<<'SQL'
            SET @foreign_key_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_NAME = 'FK_F11D61A2C58DAD6E' AND TABLE_SCHEMA = DATABASE());
            SET @sql = IF(@foreign_key_exists = 0, 'ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2C58DAD6E FOREIGN KEY (invited_user_id) REFERENCES `user` (id)', 'SELECT "Foreign key FK_F11D61A2C58DAD6E already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
        $this->addSql(<<<'SQL'
            SET @index_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invitation' AND INDEX_NAME = 'IDX_F11D61A2C58DAD6E');
            SET @sql = IF(@index_exists = 0, 'CREATE INDEX IDX_F11D61A2C58DAD6E ON invitation (invited_user_id)', 'SELECT "Index IDX_F11D61A2C58DAD6E already exists"');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE favorite_photos_user (favorite_photos_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_D99B21EBC91179F0 (favorite_photos_id), INDEX IDX_D99B21EBA76ED395 (user_id), PRIMARY KEY(favorite_photos_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE favorite_photos (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE favorite_photos_photo (favorite_photos_id INT NOT NULL, photo_id INT NOT NULL, INDEX IDX_2C3B4E2BC91179F0 (favorite_photos_id), INDEX IDX_2C3B4E2B7E9E4C8C (photo_id), PRIMARY KEY(favorite_photos_id, photo_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB COMMENT = '' 
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user ADD CONSTRAINT FK_D99B21EBA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user ADD CONSTRAINT FK_D99B21EBC91179F0 FOREIGN KEY (favorite_photos_id) REFERENCES favorite_photos (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo ADD CONSTRAINT FK_2C3B4E2B7E9E4C8C FOREIGN KEY (photo_id) REFERENCES photo (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo ADD CONSTRAINT FK_2C3B4E2BC91179F0 FOREIGN KEY (favorite_photos_id) REFERENCES favorite_photos (id) ON UPDATE NO ACTION ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friendship DROP FOREIGN KEY FK_7234A45FED442CF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friendship DROP FOREIGN KEY FK_7234A45F2261B4C3
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE friendship
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE event DROP status, CHANGE description description VARCHAR(255) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A2C58DAD6E
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_F11D61A2C58DAD6E ON invitation
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation CHANGE event_id event_id INT DEFAULT NULL, CHANGE invited_user_id inivted_user_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A22876AC0C FOREIGN KEY (inivted_user_id) REFERENCES user (id) ON UPDATE NO ACTION ON DELETE NO ACTION
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_F11D61A22876AC0C ON invitation (inivted_user_id)
        SQL);
    }
}
