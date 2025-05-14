<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250512112036 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Skipped migration: invitation table already exists';
    }

    public function up(Schema $schema): void
    {
        // No action needed; table invitation already exists
    }

    public function down(Schema $schema): void
    {
        // No action needed
    }
}
