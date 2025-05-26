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
            CREATE TABLE friendship (id INT AUTO_INCREMENT NOT NULL, requester_id INT NOT NULL, addressee_id INT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_7234A45FED442CF4 (requester_id), INDEX IDX_7234A45F2261B4C3 (addressee_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friendship ADD CONSTRAINT FK_7234A45FED442CF4 FOREIGN KEY (requester_id) REFERENCES `user` (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friendship ADD CONSTRAINT FK_7234A45F2261B4C3 FOREIGN KEY (addressee_id) REFERENCES `user` (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user DROP FOREIGN KEY FK_D99B21EBA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_user DROP FOREIGN KEY FK_D99B21EBC91179F0
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo DROP FOREIGN KEY FK_2C3B4E2B7E9E4C8C
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photos_photo DROP FOREIGN KEY FK_2C3B4E2BC91179F0
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE favorite_photos_photo
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE event ADD status VARCHAR(20) NOT NULL, CHANGE description description VARCHAR(500) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation DROP FOREIGN KEY FK_F11D61A22876AC0C
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_F11D61A22876AC0C ON invitation
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation CHANGE event_id event_id INT NOT NULL, CHANGE inivted_user_id invited_user_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE invitation ADD CONSTRAINT FK_F11D61A2C58DAD6E FOREIGN KEY (invited_user_id) REFERENCES `user` (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_F11D61A2C58DAD6E ON invitation (invited_user_id)
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
