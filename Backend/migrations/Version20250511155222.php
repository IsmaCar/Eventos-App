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
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE favorite_photo (id INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, photo_id INT NOT NULL, upload_date DATETIME NOT NULL, INDEX IDX_A23FAF3CA76ED395 (user_id), INDEX IDX_A23FAF3C7E9E4C8C (photo_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photo ADD CONSTRAINT FK_A23FAF3CA76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE favorite_photo ADD CONSTRAINT FK_A23FAF3C7E9E4C8C FOREIGN KEY (photo_id) REFERENCES photo (id)
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
