<?php

 namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;

#[ApiResource]
#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: '`user`')]
#[ORM\UniqueConstraint(name: 'UNIQ_IDENTIFIER_EMAIL', fields: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 20, unique: true)]
    #[Groups(['user:read'])]
    private ?string $username = null;

    #[ORM\Column(length: 180, unique: true)]
    #[Groups(['user:read'])]
    private ?string $email = null;

    /**
     * @var list<string> The user roles
     */
    #[ORM\Column]
    #[Groups(['user:read'])]
    private array $roles = [];

    /**
     * @var string The hashed password
     */
    #[ORM\Column]
    #[Groups(['user:read'])]
    private ?string $password = null;

    /**
     * @var Collection<int, Event>
     */
    #[ORM\OneToMany(targetEntity: Event::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $events;

    /**
     * @var Collection<int, Photo>
     */
    #[ORM\OneToMany(targetEntity: Photo::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $photos;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['user:read'])]
    private ?string $avatar = 'default-avatar.png';

    #[ORM\Column]
    private bool $banned = false;

    /**
     * @var Collection<int, FavoritePhoto>
     */
    #[ORM\OneToMany(targetEntity: FavoritePhoto::class, mappedBy: 'user', orphanRemoval: true)]
    private Collection $favoritePhotos;

    /**
     * @var Collection<int, Invitation>
     */
    #[ORM\OneToMany(targetEntity: Invitation::class, mappedBy: 'invitedUser')]
    private Collection $invitations;

    /**
     * @var Collection<int, Invitation>
     */
    #[ORM\OneToMany(targetEntity: Invitation::class, mappedBy: 'invitedBy')]
    private Collection $sentInvitations;

    /**
     * @var Collection<int, Friendship>
     */
    #[ORM\OneToMany(targetEntity: Friendship::class, mappedBy: 'requester', orphanRemoval: true)]
    private Collection $sentFriendships;

    /**
     * @var Collection<int, Friendship>
     */
    #[ORM\OneToMany(mappedBy: 'addressee', targetEntity: Friendship::class, orphanRemoval: true)]
    private Collection $receivedFriendships;

    public function __construct()
    {
        $this->events = new ArrayCollection();
        $this->photos = new ArrayCollection();
        $this->favoritePhotos = new ArrayCollection();
        $this->invitations = new ArrayCollection();
        $this->sentInvitations = new ArrayCollection();
        $this->sentFriendships = new ArrayCollection();
        $this->receivedFriendships = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): static
    {
        $this->username = $username;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    /**
     * A visual identifier that represents this user.
     *
     * @see UserInterface
     */
    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    /**
     * @see UserInterface
     *
     * @return list<string>
     */
    public function getRoles(): array
    {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    /**
     * @param list<string> $roles
     */
    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    /**
     * @see UserInterface
     */
    public function eraseCredentials(): void
    {
        // If you store any temporary, sensitive data on the user, clear it here
        // $this->plainPassword = null;
    }

    /**
     * @return Collection<int, Event>
     */
    public function getEvents(): Collection
    {
        return $this->events;
    }

    public function addEvent(Event $event): static
    {
        if (!$this->events->contains($event)) {
            $this->events->add($event);
            $event->setUser($this);
        }

        return $this;
    }

    public function removeEvent(Event $event): static
    {
        if ($this->events->removeElement($event)) {
            // set the owning side to null (unless already changed)
            if ($event->getUser() === $this) {
                $event->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Photo>
     */
    public function getPhotos(): Collection
    {
        return $this->photos;
    }

    public function addPhoto(Photo $photo): static
    {
        if (!$this->photos->contains($photo)) {
            $this->photos->add($photo);
            $photo->setUser($this);
        }

        return $this;
    }

    public function removePhoto(Photo $photo): static
    {
        if ($this->photos->removeElement($photo)) {
            // set the owning side to null (unless already changed)
            if ($photo->getUser() === $this) {
                $photo->setUser(null);
            }
        }

        return $this;
    }

    public function getAvatar(): ?string
    {
        return $this->avatar;
    }

    public function setAvatar(?string $avatar): static
    {
        $this->avatar = $avatar;

        return $this;
    }

    public function isBanned(): ?bool
    {
        return $this->banned;
    }

    public function setBanned(bool $banned): static
    {
        $this->banned = $banned;

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
            $favoritePhoto->setUser($this);
        }

        return $this;
    }

    public function removeFavoritePhoto(FavoritePhoto $favoritePhoto): static
    {
        if ($this->favoritePhotos->removeElement($favoritePhoto)) {
            // set the owning side to null (unless already changed)
            if ($favoritePhoto->getUser() === $this) {
                $favoritePhoto->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Invitation>
     */
    public function getInvitations(): Collection
    {
        return $this->invitations;
    }

    public function addInvitation(Invitation $invitation): static
    {
        if (!$this->invitations->contains($invitation)) {
            $this->invitations->add($invitation);
            $invitation->setInvitedUser($this);
        }

        return $this;
    }

    public function removeInvitation(Invitation $invitation): static
    {
        if ($this->invitations->removeElement($invitation)) {
            // set the owning side to null (unless already changed)
            if ($invitation->getInvitedUser() === $this) {
                $invitation->setInvitedUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Invitation>
     */
    public function getSentInvitations(): Collection
    {
        return $this->sentInvitations;
    }

    public function addSentInvitation(Invitation $invitation): static
    {
        if (!$this->sentInvitations->contains($invitation)) {
            $this->sentInvitations->add($invitation);
            $invitation->setInvitedBy($this);
        }

        return $this;
    }

    public function removeSentInvitation(Invitation $invitation): static
    {
        if ($this->sentInvitations->removeElement($invitation)) {
            // set the owning side to null (unless already changed)
            if ($invitation->getInvitedBy() === $this) {
                $invitation->setInvitedBy(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Friendship>
     */
    public function getSentFriendships(): Collection
    {
        return $this->sentFriendships;
    }

    public function addSentFriendship(Friendship $friendship): self
    {
        if (!$this->sentFriendships->contains($friendship)) {
            $this->sentFriendships->add($friendship);
            $friendship->setRequester($this);
        }
        return $this;
    }

    public function removeSentFriendship(Friendship $friendship): self
    {
        if ($this->sentFriendships->removeElement($friendship)) {
            // set the owning side to null (unless already changed)
            if ($friendship->getRequester() === $this) {
                $friendship->setRequester(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Friendship>
     */
    public function getReceivedFriendships(): Collection
    {
        return $this->receivedFriendships;
    }

    public function addReceivedFriendship(Friendship $friendship): self
    {
        if (!$this->receivedFriendships->contains($friendship)) {
            $this->receivedFriendships->add($friendship);
            $friendship->setAddressee($this);
        }
        return $this;
    }

    public function removeReceivedFriendship(Friendship $friendship): self
    {
        if ($this->receivedFriendships->removeElement($friendship)) {
            // set the owning side to null (unless already changed)
            if ($friendship->getAddressee() === $this) {
                $friendship->setAddressee(null);
            }
        }
        return $this;
    }
}