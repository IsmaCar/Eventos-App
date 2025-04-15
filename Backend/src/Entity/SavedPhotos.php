<?php
// src/Entity/SavedPhoto.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'Saved_photos')]
class SavedPhoto
{
    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private User $user;

    #[ORM\Id]
    #[ORM\ManyToOne(targetEntity: Picture::class)]
    #[ORM\JoinColumn(name: 'picture_id', referencedColumnName: 'id')]
    private Picture $picture;

    // Getters y setters...

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getPicture(): ?Picture
    {
        return $this->picture;
    }

    public function setPicture(?Picture $picture): static
    {
        $this->picture = $picture;

        return $this;
    }
}

?>