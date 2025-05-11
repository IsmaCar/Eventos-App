<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\PhotoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PhotoRepository::class)]
#[ApiResource]
class Photo
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Event $event = null;

    #[ORM\ManyToOne(inversedBy: 'photos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 255)]
    private ?string $url_photo = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $upload_date = null;

    /**
     * @var Collection<int, FavoritePhoto>
     */
    #[ORM\OneToMany(targetEntity: FavoritePhoto::class, mappedBy: 'photo', orphanRemoval: true)]
    private Collection $favoritePhotos;

    public function __construct()
    {
        $this->favoritePhotos = new ArrayCollection();
    }


    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEvent(): ?Event
    {
        return $this->event;
    }

    public function setEvent(?Event $event): static
    {
        $this->event = $event;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getUrlPhoto(): ?string
    {
        return $this->url_photo;
    }

    public function setUrlPhoto(string $url_photo): static
    {
        $this->url_photo = $url_photo;

        return $this;
    }

    public function getUploadDate(): ?\DateTimeInterface
    {
        return $this->upload_date;
    }

    public function setUploadDate(\DateTimeInterface $upload_date): static
    {
        $this->upload_date = $upload_date;

        return $this;
    }

    /**
     * @return Collection<int, FavoritePhoto>
     */
    public function getFavoritePhotos(): Collection
    {
        return $this->favoritePhotos;
    }

    public function addFavoritePhoto(FavoritePhoto $favoritePhoto): static
    {
        if (!$this->favoritePhotos->contains($favoritePhoto)) {
            $this->favoritePhotos->add($favoritePhoto);
            $favoritePhoto->setPhoto($this);
        }

        return $this;
    }

    public function removeFavoritePhoto(FavoritePhoto $favoritePhoto): static
    {
        if ($this->favoritePhotos->removeElement($favoritePhoto)) {
            // set the owning side to null (unless already changed)
            if ($favoritePhoto->getPhoto() === $this) {
                $favoritePhoto->setPhoto(null);
            }
        }

        return $this;
    }

    
}
