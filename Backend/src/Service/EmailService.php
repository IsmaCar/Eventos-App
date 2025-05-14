<?php
// src/Service/EmailService.php
namespace App\Service;

use App\Entity\Invitation;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class EmailService
{
    private $mailer;
    private $router;
    
    public function __construct(MailerInterface $mailer, UrlGeneratorInterface $router)
    {
        $this->mailer = $mailer;
        $this->router = $router;
    }
    
    public function sendEventInvitation(Invitation $invitation): void
    {
        try {
        error_log("Intentando enviar email de invitación a: " . $invitation->getEmail());
        
        $event = $invitation->getEvent();
        $inviter = $invitation->getInvitedBy();
        
        if (!$event || !$inviter || !$invitation->getEmail()) {
            error_log("Error: Invitación incompleta - Evento: " . ($event ? "Sí" : "No") . 
                      ", Invitador: " . ($inviter ? "Sí" : "No") . 
                      ", Email: " . $invitation->getEmail());
            throw new \InvalidArgumentException('Invitation is missing required data');
        }
        
        
        $subject = "{$inviter->getUsername()} te ha invitado a un evento";
        
        // URL para aceptar/rechazar la invitación
        $registerUrl = $this->router->generate('app_register', [], UrlGeneratorInterface::ABSOLUTE_URL);
        if ($invitation->getToken()) {
            $registerUrl .= '?invitation=' . $invitation->getToken();
        }
        
        // Formatear fecha correctamente, comprueba que getEventDate existe
        $eventDate = method_exists($event, 'getEventDate') ? 
            $event->getEventDate()->format('d/m/Y') : 'Fecha por confirmar';
        
        $html = "
            <h2>Has sido invitado al evento {$event->getTitle()}</h2>
            <p>{$inviter->getUsername()} te ha invitado a participar en este evento.</p>
            <p><strong>Fecha:</strong> {$eventDate}</p>
            <p><strong>Descripción:</strong> {$event->getDescription()}</p>
            <br>
            <p>Si ya tienes una cuenta, inicia sesión para responder a la invitación.</p>
            <p>Si aún no tienes una cuenta, <a href='{$registerUrl}'>regístrate aquí</a> para participar en el evento.</p>
        ";
        
        $email = (new Email())
            ->from('noreply@eventosapp.com')
            ->to($invitation->getEmail())
            ->subject($subject)
            ->html($html);
            
        $this->mailer->send($email);
        error_log("Email enviado exitosamente a: " . $invitation->getEmail());

    } catch (\Exception $e) {
        // Registrar el error o lanzar una excepción personalizada
        throw new \RuntimeException('Failed to send invitation email: ' . $e->getMessage(), 0, $e);
    }
    }
}