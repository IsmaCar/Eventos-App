<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250516090119 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE friend_ship (id INT AUTO_INCREMENT NOT NULL, requester_id INT DEFAULT NULL, addressee_id INT DEFAULT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', update_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_604A37C4ED442CF4 (requester_id), INDEX IDX_604A37C42261B4C3 (addressee_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friend_ship ADD CONSTRAINT FK_604A37C4ED442CF4 FOREIGN KEY (requester_id) REFERENCES `user` (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friend_ship ADD CONSTRAINT FK_604A37C42261B4C3 FOREIGN KEY (addressee_id) REFERENCES `user` (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE friend_ship DROP FOREIGN KEY FK_604A37C4ED442CF4
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE friend_ship DROP FOREIGN KEY FK_604A37C42261B4C3
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE friend_ship
        SQL);
    }
}
