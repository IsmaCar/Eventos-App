<?php
// src/Entity/Contains.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'Contains')]
class Contains
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Playlist::class)]
    #[ORM\JoinColumn(name: 'playlist_id', referencedColumnName: 'id')]
    private Playlist $playlist;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: SongPlaylist::class)]
    #[ORM\JoinColumn(name: 'song_id', referencedColumnName: 'id')]
    private SongPlaylist $song;

    // Getters y setters...

    public function getPlaylist(): ?Playlist
    {
        return $this->playlist;
    }

    public function setPlaylist(?Playlist $playlist): static
    {
        $this->playlist = $playlist;

        return $this;
    }

    public function getSong(): ?SongPlaylist
    {
        return $this->song;
    }

    public function setSong(?SongPlaylist $song): static
    {
        $this->song = $song;

        return $this;
    }
}

?>