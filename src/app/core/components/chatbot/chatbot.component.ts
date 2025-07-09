// src/app/shared/components/chatbot/chatbot.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatbotService } from '../../services/chatbot.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ChatMessage} from '../../models/chat-message.entity';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  // Estado del chat
  isOpen = false;
  isTyping = false;
  messages: ChatMessage[] = [];
  currentMessage = '';

  // Control de scroll automático
  shouldScrollToBottom = true;
  isUserScrolling = false; // ← Quitamos 'private'

  // Subscripciones
  private subscriptions: Subscription[] = [];

  // Usuario actual
  currentUser: any = null;

  constructor(
    private chatbotService: ChatbotService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeChat();
  }

  ngAfterViewChecked(): void {
    // Solo hacer scroll automático si es necesario
    if (this.shouldScrollToBottom && !this.isUserScrolling) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Detecta cuando el usuario está haciendo scroll manualmente
   */
  onScroll(): void {
    if (!this.messagesContainer?.nativeElement) return;

    const container = this.messagesContainer.nativeElement;
    const threshold = 50; // píxeles de tolerancia

    // Verificar si el usuario está cerca del final
    const isNearBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - threshold);

    // Si no está cerca del final, el usuario está haciendo scroll manual
    this.isUserScrolling = !isNearBottom;
  }
  getUserProfileImage(): string {
    return this.currentUser?.logo || this.currentUser?.profileImage || '';
  }
  /**
   * Inicializa el chat con mensaje de bienvenida
   */
  private initializeChat(): void {
    const welcomeMessage = this.getWelcomeMessage();

    this.messages = [{
      id: this.generateMessageId(),
      content: welcomeMessage,
      sender: 'bot',
      timestamp: new Date()
    }];

    this.shouldScrollToBottom = true;
  }

  /**
   * Genera mensaje de bienvenida personalizado
   */
  private getWelcomeMessage(): string {
    const userName = this.currentUser?.name || 'Usuario';
    const userRole = this.currentUser?.role || 'usuario';

    // Esperar a que las traducciones estén cargadas
    let welcomeMessage = this.translate.instant('CHATBOT.WELCOME.GREETING', { userName });

    // Si no se tradujo correctamente, usar fallback
    if (welcomeMessage.includes('CHATBOT.WELCOME.GREETING')) {
      welcomeMessage = `¡Hola ${userName}! 👋`;
    }

    let intro = this.translate.instant('CHATBOT.WELCOME.INTRO');
    if (intro.includes('CHATBOT.WELCOME.INTRO')) {
      intro = 'Soy tu asistente virtual de TextilFlow. Estoy aquí para ayudarte con consultas rápidas sobre la plataforma.';
    }

    welcomeMessage += '\n\n' + intro + '\n\n';

    let roleHelp = '';
    if (userRole === 'businessman') {
      roleHelp = this.translate.instant('CHATBOT.WELCOME.BUSINESSMAN_HELP');
      if (roleHelp.includes('CHATBOT.WELCOME.BUSINESSMAN_HELP')) {
        roleHelp = '🔍 **Como businessman puedes preguntar:**\n• "¿Cuáles son mis lotes?"\n• "Buscar proveedores de algodón"\n• "Estado de mis solicitudes"\n• "Mis observaciones pendientes"';
      }
    } else if (userRole === 'supplier') {
      roleHelp = this.translate.instant('CHATBOT.WELCOME.SUPPLIER_HELP');
      if (roleHelp.includes('CHATBOT.WELCOME.SUPPLIER_HELP')) {
        roleHelp = '🔍 **Como supplier puedes preguntar:**\n• "¿Qué lotes tengo asignados?"\n• "Mis solicitudes recibidas"\n• "Observaciones de mis lotes"';
      }
    } else {
      roleHelp = this.translate.instant('CHATBOT.WELCOME.GENERAL_HELP');
      if (roleHelp.includes('CHATBOT.WELCOME.GENERAL_HELP')) {
        roleHelp = '🔍 **Puedes preguntar sobre:**\n• Estados de lotes y envíos\n• Información de proveedores\n• Solicitudes y observaciones';
      }
    }

    welcomeMessage += roleHelp;

    let additionalHelp = this.translate.instant('CHATBOT.WELCOME.ADDITIONAL_HELP');
    if (additionalHelp.includes('CHATBOT.WELCOME.ADDITIONAL_HELP')) {
      additionalHelp = '💬 **También puedo ayudarte con:**\n• Explicar cómo usar la plataforma\n• Resolver dudas generales\n• Guiarte a las secciones correctas';
    }

    let finalQuestion = this.translate.instant('CHATBOT.WELCOME.FINAL_QUESTION');
    if (finalQuestion.includes('CHATBOT.WELCOME.FINAL_QUESTION')) {
      finalQuestion = '¿En qué puedo ayudarte hoy?';
    }

    welcomeMessage += '\n\n' + additionalHelp + '\n\n' + finalQuestion;

    return welcomeMessage;
  }

  /**
   * Alterna la visibilidad del chat
   */
  toggleChat(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      // Dar tiempo para que se renderice el DOM
      setTimeout(() => {
        this.focusInput();
        this.shouldScrollToBottom = true;
        this.scrollToBottom();
      }, 100);
    }
  }

  /**
   * Envía un mensaje del usuario
   */
  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isTyping) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: this.currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const messageToProcess = this.currentMessage.trim();
    this.currentMessage = '';

    // Indicar que se debe hacer scroll al agregar nuevo mensaje
    this.shouldScrollToBottom = true;
    this.isUserScrolling = false;

    // Mostrar indicador de "escribiendo"
    this.showTypingIndicator();

    // Procesar mensaje con el servicio
    const subscription = this.chatbotService.processUserMessage(messageToProcess)
      .subscribe({
        next: (response) => {
          this.hideTypingIndicator();
          this.addBotMessage(response);
        },
        error: (error) => {
          console.error('Error processing message:', error);
          this.hideTypingIndicator();
          this.addBotMessage(this.translate.instant('CHATBOT.RESPONSES.ERROR_GENERAL'));
        }
      });

    this.subscriptions.push(subscription);
  }

  /**
   * Maneja el evento de Enter en el input
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Envía mensajes predefinidos (botones rápidos)
   */
  sendQuickMessage(message: string): void {
    this.currentMessage = message;
    this.sendMessage();
  }

  /**
   * Muestra indicador de escritura
   */
  private showTypingIndicator(): void {
    this.isTyping = true;

    const typingMessage: ChatMessage = {
      id: 'typing-indicator',
      content: this.translate.instant('CHATBOT.TYPING'),
      sender: 'bot',
      timestamp: new Date(),
      isTyping: true
    };

    this.messages.push(typingMessage);
    this.shouldScrollToBottom = true;
  }

  /**
   * Oculta indicador de escritura
   */
  private hideTypingIndicator(): void {
    this.isTyping = false;
    this.messages = this.messages.filter(msg => !msg.isTyping);
  }

  /**
   * Agrega mensaje del bot
   */
  private addBotMessage(content: string): void {
    const botMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: content,
      sender: 'bot',
      timestamp: new Date()
    };

    this.messages.push(botMessage);
    this.shouldScrollToBottom = true;
    this.isUserScrolling = false;
  }

  /**
   * Limpia el historial del chat
   */
  clearChat(): void {
    this.messages = [];
    this.initializeChat();
  }

  /**
   * Minimiza el chat
   */
  minimizeChat(): void {
    this.isOpen = false;
  }

  /**
   * Enfoca el input de mensaje
   */
  private focusInput(): void {
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  /**
   * Hace scroll al final del contenedor de mensajes de forma suave
   */
  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      setTimeout(() => {
        const container = this.messagesContainer.nativeElement;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }

  /**
   * Scroll manual al final (para botón)
   */
  scrollToBottomManual(): void {
    this.isUserScrolling = false;
    this.shouldScrollToBottom = true;
    this.scrollToBottom();
  }

  /**
   * Verifica si el usuario puede hacer scroll hacia abajo
   */
  canScrollDown(): boolean {
    if (!this.messagesContainer?.nativeElement) return false;

    const container = this.messagesContainer.nativeElement;
    return (container.scrollTop + container.clientHeight) < (container.scrollHeight - 20);
  }

  /**
   * Genera ID único para mensajes
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene la clase CSS para el avatar según el sender
   */
  getAvatarClass(sender: string): string {
    return sender === 'user' ? 'user-avatar' : 'bot-avatar';
  }

  /**
   * Obtiene la inicial del usuario para el avatar
   */
  getUserInitial(): string {
    return this.currentUser?.name?.charAt(0).toUpperCase() || 'U';
  }

  /**
   * Formatea la hora del mensaje
   */
  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Convierte texto con saltos de línea a HTML
   */
  formatMessageContent(content: string): string {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '&bull;');
  }

  /**
   * Botones de acceso rápido según el rol del usuario
   */
  getQuickActions(): string[] {
    const role = this.currentUser?.role;

    if (role === 'businessman') {
      return [
        this.translate.instant('CHATBOT.QUICK_ACTIONS.BUSINESSMAN.MY_BATCHES') || '¿Cuáles son mis lotes?',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.BUSINESSMAN.FIND_SUPPLIERS') || 'Buscar proveedores',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.BUSINESSMAN.MY_REQUESTS') || 'Mis solicitudes',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.BUSINESSMAN.PLATFORM_HELP') || 'Ayuda con la plataforma'
      ];
    } else if (role === 'supplier') {
      return [
        this.translate.instant('CHATBOT.QUICK_ACTIONS.SUPPLIER.ASSIGNED_BATCHES') || 'Mis lotes asignados',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.SUPPLIER.RECEIVED_REQUESTS') || 'Solicitudes recibidas',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.SUPPLIER.MY_OBSERVATIONS') || 'Mis observaciones',
        this.translate.instant('CHATBOT.QUICK_ACTIONS.SUPPLIER.PLATFORM_HELP') || 'Ayuda con la plataforma'
      ];
    }

    return [
      this.translate.instant('CHATBOT.QUICK_ACTIONS.GENERAL.PLATFORM_HELP') || 'Ayuda con la plataforma',
      this.translate.instant('CHATBOT.QUICK_ACTIONS.GENERAL.GENERAL_INFO') || 'Información general'
    ];
  }

  /**
   * TrackBy function para mejorar performance del ngFor
   */
  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
}
