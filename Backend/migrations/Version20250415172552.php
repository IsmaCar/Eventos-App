<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250415172552 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE Comments (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, user_id INT DEFAULT NULL, text LONGTEXT NOT NULL, date DATETIME NOT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_A6E8F47C71F7E88B (event_id), INDEX IDX_A6E8F47CA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Contains (playlist_id INT NOT NULL, song_id INT NOT NULL, INDEX IDX_778C08286BBD148 (playlist_id), INDEX IDX_778C0828A0BDB2F3 (song_id), PRIMARY KEY(playlist_id, song_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Events (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, title VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, date DATE NOT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, delete_at DATETIME DEFAULT NULL, INDEX IDX_542B527CA76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE History_playlists (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, playlist_id INT DEFAULT NULL, user_id INT DEFAULT NULL, action VARCHAR(50) NOT NULL, song_url LONGTEXT DEFAULT NULL, date DATETIME NOT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_E6EC707771F7E88B (event_id), INDEX IDX_E6EC70776BBD148 (playlist_id), INDEX IDX_E6EC7077A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Invitations (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, user_organiser_id INT DEFAULT NULL, user_guest_id INT DEFAULT NULL, email_guest VARCHAR(100) DEFAULT NULL, send_date DATETIME NOT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_A5BB9F7971F7E88B (event_id), INDEX IDX_A5BB9F7920AF6010 (user_organiser_id), INDEX IDX_A5BB9F797AC74258 (user_guest_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Locations (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, latitude NUMERIC(9, 6) NOT NULL, longitude NUMERIC(9, 6) NOT NULL, address VARCHAR(255) DEFAULT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_9517C81971F7E88B (event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Pictures (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, user_id INT DEFAULT NULL, url_picture LONGTEXT NOT NULL, upload_date DATETIME NOT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_760A4D9671F7E88B (event_id), INDEX IDX_760A4D96A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Playlists (id INT AUTO_INCREMENT NOT NULL, event_id INT DEFAULT NULL, name VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_DCF793CC71F7E88B (event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Saved_photos (user_id INT NOT NULL, picture_id INT NOT NULL, INDEX IDX_7441403AA76ED395 (user_id), INDEX IDX_7441403AEE45BDBF (picture_id), PRIMARY KEY(user_id, picture_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Songs_playlist (id INT AUTO_INCREMENT NOT NULL, playlist_id INT DEFAULT NULL, event_id INT DEFAULT NULL, song_url LONGTEXT NOT NULL, name VARCHAR(100) NOT NULL, artist VARCHAR(100) NOT NULL, image LONGTEXT DEFAULT NULL, deleted TINYINT(1) DEFAULT 0 NOT NULL, INDEX IDX_19EBDA3F6BBD148 (playlist_id), INDEX IDX_19EBDA3F71F7E88B (event_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE Users (id INT AUTO_INCREMENT NOT NULL, username VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, password VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_D5428AEDF85E0677 (username), UNIQUE INDEX UNIQ_D5428AEDE7927C74 (email), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', available_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', delivered_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_75EA56E0FB7336F0 (queue_name), INDEX IDX_75EA56E0E3BD61CE (available_at), INDEX IDX_75EA56E016BA31DB (delivered_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Comments ADD CONSTRAINT FK_A6E8F47C71F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Comments ADD CONSTRAINT FK_A6E8F47CA76ED395 FOREIGN KEY (user_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Contains ADD CONSTRAINT FK_778C08286BBD148 FOREIGN KEY (playlist_id) REFERENCES Playlists (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Contains ADD CONSTRAINT FK_778C0828A0BDB2F3 FOREIGN KEY (song_id) REFERENCES Songs_playlist (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Events ADD CONSTRAINT FK_542B527CA76ED395 FOREIGN KEY (user_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists ADD CONSTRAINT FK_E6EC707771F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists ADD CONSTRAINT FK_E6EC70776BBD148 FOREIGN KEY (playlist_id) REFERENCES Playlists (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists ADD CONSTRAINT FK_E6EC7077A76ED395 FOREIGN KEY (user_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations ADD CONSTRAINT FK_A5BB9F7971F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations ADD CONSTRAINT FK_A5BB9F7920AF6010 FOREIGN KEY (user_organiser_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations ADD CONSTRAINT FK_A5BB9F797AC74258 FOREIGN KEY (user_guest_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Locations ADD CONSTRAINT FK_9517C81971F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Pictures ADD CONSTRAINT FK_760A4D9671F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Pictures ADD CONSTRAINT FK_760A4D96A76ED395 FOREIGN KEY (user_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Playlists ADD CONSTRAINT FK_DCF793CC71F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Saved_photos ADD CONSTRAINT FK_7441403AA76ED395 FOREIGN KEY (user_id) REFERENCES Users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Saved_photos ADD CONSTRAINT FK_7441403AEE45BDBF FOREIGN KEY (picture_id) REFERENCES Pictures (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Songs_playlist ADD CONSTRAINT FK_19EBDA3F6BBD148 FOREIGN KEY (playlist_id) REFERENCES Playlists (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Songs_playlist ADD CONSTRAINT FK_19EBDA3F71F7E88B FOREIGN KEY (event_id) REFERENCES Events (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE Comments DROP FOREIGN KEY FK_A6E8F47C71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Comments DROP FOREIGN KEY FK_A6E8F47CA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Contains DROP FOREIGN KEY FK_778C08286BBD148
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Contains DROP FOREIGN KEY FK_778C0828A0BDB2F3
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Events DROP FOREIGN KEY FK_542B527CA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists DROP FOREIGN KEY FK_E6EC707771F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists DROP FOREIGN KEY FK_E6EC70776BBD148
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE History_playlists DROP FOREIGN KEY FK_E6EC7077A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations DROP FOREIGN KEY FK_A5BB9F7971F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations DROP FOREIGN KEY FK_A5BB9F7920AF6010
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Invitations DROP FOREIGN KEY FK_A5BB9F797AC74258
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Locations DROP FOREIGN KEY FK_9517C81971F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Pictures DROP FOREIGN KEY FK_760A4D9671F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Pictures DROP FOREIGN KEY FK_760A4D96A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Playlists DROP FOREIGN KEY FK_DCF793CC71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Saved_photos DROP FOREIGN KEY FK_7441403AA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Saved_photos DROP FOREIGN KEY FK_7441403AEE45BDBF
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Songs_playlist DROP FOREIGN KEY FK_19EBDA3F6BBD148
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE Songs_playlist DROP FOREIGN KEY FK_19EBDA3F71F7E88B
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Comments
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Contains
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Events
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE History_playlists
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Invitations
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Locations
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Pictures
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Playlists
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Saved_photos
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Songs_playlist
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE Users
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE messenger_messages
        SQL);
    }
}
