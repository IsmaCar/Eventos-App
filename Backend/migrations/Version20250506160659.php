<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250506160659 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        // Create participant tables only if they don't exist
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS participant (id INT AUTO_INCREMENT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS participant_user (participant_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_5927C4779D1C3019 (participant_id), INDEX IDX_5927C477A76ED395 (user_id), PRIMARY KEY(participant_id, user_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE IF NOT EXISTS participant_event (participant_id INT NOT NULL, event_id INT NOT NULL, INDEX IDX_FA1BA31E9D1C3019 (participant_id), INDEX IDX_FA1BA31E71F7E88B (event_id), PRIMARY KEY(participant_id, event_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_user ADD CONSTRAINT FK_5927C4779D1C3019 FOREIGN KEY (participant_id) REFERENCES participant (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_user ADD CONSTRAINT FK_5927C477A76ED395 FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_event ADD CONSTRAINT FK_FA1BA31E9D1C3019 FOREIGN KEY (participant_id) REFERENCES participant (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_event ADD CONSTRAINT FK_FA1BA31E71F7E88B FOREIGN KEY (event_id) REFERENCES event (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_user DROP FOREIGN KEY FK_5927C4779D1C3019
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_user DROP FOREIGN KEY FK_5927C477A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_event DROP FOREIGN KEY FK_FA1BA31E9D1C3019
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE participant_event DROP FOREIGN KEY FK_FA1BA31E71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE participant
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE participant_user
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE participant_event
        SQL);
    }
}
