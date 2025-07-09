// src/app/shared/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, of, forkJoin, switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';
import { ChatbotIntent} from '../models/chat-message.entity';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly HF_API_URL = 'https://router.huggingface.co/fireworks-ai/inference/v1/chat/completions';
  private readonly HF_API_KEY = environment.huggingFaceApiKey;
  private readonly MODEL_NAME = 'accounts/fireworks/models/llama-v3p1-8b-instruct';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  /**
   * Procesa el mensaje del usuario y determina la acción
   */
  processUserMessage(message: string): Observable<string> {
    // CAMBIO: Siempre usar IA pero con contexto de la plataforma
    return this.getAIResponseWithContext(message);
  }

  /**
   * Analiza la intención del usuario (sin IA externa)
   */
  private analyzeIntent(message: string): ChatbotIntent {
    const lowerMessage = message.toLowerCase();

    // Patrones para identificar intenciones
    const patterns = {
      'check_batches': [
        'mis lotes', 'mis envíos', 'lotes', 'envíos', 'batches',
        'estado de mis lotes', 'mis pedidos', 'estado del envío'
      ],
      'find_suppliers': [
        'buscar proveedor', 'proveedores', 'suppliers', 'encontrar proveedor',
        'proveedor de', 'busco proveedor'
      ],
      'check_requests': [
        'mis solicitudes', 'requests', 'peticiones', 'solicitudes'
      ],
      'check_observations': [
        'observaciones', 'comentarios', 'notas', 'observations'
      ],
      'platform_help': [
        'como usar', 'ayuda', 'help', 'tutorial', 'funciona',
        'qué puedo hacer', 'opciones'
      ]
    };

    // Buscar coincidencias
    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return {
          intent,
          confidence: 0.8,
          action: intent.includes('check_') || intent.includes('find_') ? 'api_call' : 'general_help'
        };
      }
    }

    return {
      intent: 'general_chat',
      confidence: 0.5,
      action: 'ai_response'
    };
  }

  /**
   * Maneja llamadas a la API según la intención
   */
  private handleApiCall(intent: ChatbotIntent): Observable<string> {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      return of(this.translate.instant('CHATBOT.RESPONSES.LOGIN_REQUIRED'));
    }

    switch (intent.intent) {
      case 'check_batches':
        return this.getBatchesInfo(currentUser.id, currentUser.role);

      case 'find_suppliers':
        return this.getSuppliersInfo();

      case 'check_requests':
        return this.getRequestsInfo(currentUser.id, currentUser.role);

      case 'check_observations':
        return this.getObservationsInfo(currentUser.id, currentUser.role);

      default:
        return of(this.translate.instant('CHATBOT.RESPONSES.DEFAULT_HELP'));
    }
  }

  /**
   * Obtiene información de lotes/envíos
   */
  private getBatchesInfo(userId: string, role: string): Observable<string> {
    const endpoint = role === 'businessman'
      ? `${environment.batchesEndpointPath}/businessman/${userId}`
      : `${environment.batchesEndpointPath}/supplier/${userId}`;

    return this.makeApiCall(endpoint).pipe(
      map((batches: any[]) => {
        if (!batches || batches.length === 0) {
          return this.translate.instant('CHATBOT.RESPONSES.NO_BATCHES');
        }

        const statusCounts = batches.reduce((acc, batch) => {
          acc[batch.status] = (acc[batch.status] || 0) + 1;
          return acc;
        }, {});

        let response = this.translate.instant('CHATBOT.BATCHES.SUMMARY', { count: batches.length }) + '\n\n';

        Object.entries(statusCounts).forEach(([status, count]) => {
          response += `• ${status}: ${count} lote(s)\n`;
        });

        // Mostrar los últimos 3 lotes
        const recentBatches = batches.slice(0, 3);
        response += '\n' + this.translate.instant('CHATBOT.BATCHES.RECENT_TITLE') + '\n';

        recentBatches.forEach(batch => {
          const code = batch.code || this.translate.instant('CHATBOT.BATCHES.NO_CODE');
          const client = batch.client || this.translate.instant('CHATBOT.BATCHES.NO_CLIENT');
          response += `• ${code} - ${batch.status} - ${client}\n`;
        });

        return response;
      }),
      catchError(error => of(this.translate.instant('CHATBOT.RESPONSES.ERROR_BATCHES')))
    );
  }

  /**
   * Obtiene información de proveedores
   */
  private getSuppliersInfo(): Observable<string> {
    return this.makeApiCall(environment.supplierEndpointPath).pipe(
      map((suppliers: any[]) => {
        if (!suppliers || suppliers.length === 0) {
          return this.translate.instant('CHATBOT.RESPONSES.NO_SUPPLIERS');
        }

        let response = this.translate.instant('CHATBOT.SUPPLIERS.SUMMARY', { count: suppliers.length }) + '\n\n';

        // Agrupar por especialización
        const bySpecialization = suppliers.reduce((acc, supplier) => {
          const spec = supplier.specialization || this.translate.instant('CHATBOT.SUPPLIERS.NO_SPECIALIZATION');
          if (!acc[spec]) acc[spec] = [];
          acc[spec].push(supplier);
          return acc;
        }, {});

        Object.entries(bySpecialization).forEach(([spec, suppList]: [string, any]) => {
          response += this.translate.instant('CHATBOT.SUPPLIERS.BY_SPECIALIZATION', {
            specialization: spec,
            count: suppList.length
          }) + '\n';
        });

        return response;
      }),
      catchError(error => of(this.translate.instant('CHATBOT.RESPONSES.ERROR_SUPPLIERS')))
    );
  }

  /**
   * Obtiene información de solicitudes
   */
  private getRequestsInfo(userId: string, role: string): Observable<string> {
    const endpoint = role === 'businessman'
      ? `${environment.businessSupplierRequests}/businessman/${userId}`
      : `${environment.businessSupplierRequests}/supplier/${userId}`;

    return this.makeApiCall(endpoint).pipe(
      map((requests: any[]) => {
        if (!requests || requests.length === 0) {
          return this.translate.instant('CHATBOT.RESPONSES.NO_REQUESTS');
        }

        const statusCounts = requests.reduce((acc, req) => {
          acc[req.status] = (acc[req.status] || 0) + 1;
          return acc;
        }, {});

        let response = this.translate.instant('CHATBOT.REQUESTS.SUMMARY', { count: requests.length }) + '\n\n';

        Object.entries(statusCounts).forEach(([status, count]) => {
          response += `• ${status}: ${count} solicitud(es)\n`;
        });

        return response;
      }),
      catchError(error => of(this.translate.instant('CHATBOT.RESPONSES.ERROR_REQUESTS')))
    );
  }

  /**
   * Obtiene información de observaciones
   */
  private getObservationsInfo(userId: string, role: string): Observable<string> {
    const endpoint = role === 'businessman'
      ? `${environment.observationEndpointPath}/businessman/${userId}`
      : `${environment.observationEndpointPath}/supplier/${userId}`;

    return this.makeApiCall(endpoint).pipe(
      map((observations: any[]) => {
        if (!observations || observations.length === 0) {
          return this.translate.instant('CHATBOT.RESPONSES.NO_OBSERVATIONS');
        }

        let response = this.translate.instant('CHATBOT.OBSERVATIONS.SUMMARY', { count: observations.length }) + '\n\n';

        // Mostrar las últimas 3
        const recent = observations.slice(0, 3);
        recent.forEach(obs => {
          const code = obs.batchCode || this.translate.instant('CHATBOT.OBSERVATIONS.NO_CODE');
          response += `• Lote ${code} - ${obs.status}\n`;
        });

        return response;
      }),
      catchError(error => of(this.translate.instant('CHATBOT.RESPONSES.ERROR_OBSERVATIONS')))
    );
  }

  /**
   * Realiza llamadas a tu API
   */
  private makeApiCall(endpoint: string): Observable<any> {
    const url = `${environment.serverBaseUrl}${endpoint}`;

    let headers = new HttpHeaders();
    const token = localStorage.getItem(environment.tokenStorageKey);

    if (token && !token.startsWith('fake-jwt-token-') && !token.startsWith('temp-jwt-token-')) {
      headers = headers.set('Authorization', `${environment.tokenPrefix}${token}`);
    }

    return this.http.get(url, { headers });
  }

  /**
   * Respuestas de ayuda general
   */
  private getGeneralHelpResponse(intent: string): string {
    if (intent === 'platform_help') {
      const currentUserRole = this.authService.getCurrentUserRole();

      let helpMessage = this.translate.instant('CHATBOT.PLATFORM_HELP.TITLE') + '\n\n';
      helpMessage += this.translate.instant('CHATBOT.PLATFORM_HELP.QUERIES_TITLE') + '\n';
      helpMessage += this.translate.instant('CHATBOT.PLATFORM_HELP.QUERIES_LIST') + '\n\n';
      helpMessage += '💼 **Según tu rol:**\n';

      if (currentUserRole === 'businessman') {
        helpMessage += this.translate.instant('CHATBOT.PLATFORM_HELP.ROLE_HELP_BUSINESSMAN');
      } else if (currentUserRole === 'supplier') {
        helpMessage += this.translate.instant('CHATBOT.PLATFORM_HELP.ROLE_HELP_SUPPLIER');
      }

      helpMessage += '\n\n' + this.translate.instant('CHATBOT.PLATFORM_HELP.FINAL_QUESTION');

      return helpMessage;
    }

    return this.translate.instant('CHATBOT.RESPONSES.DEFAULT_HELP');
  }

  /**
   * Obtiene respuesta de IA con contexto de la plataforma y datos reales
   */
  private getAIResponseWithContext(message: string): Observable<string> {
    console.log('🔍 API Key presente:', !!this.HF_API_KEY);
    console.log('🔍 API Key válida:', this.HF_API_KEY !== 'hf_tu_token_real_aqui' && this.HF_API_KEY !== '');

    // Verificar si hay API key válida
    if (!this.HF_API_KEY || this.HF_API_KEY === 'hf_tu_token_real_aqui' || this.HF_API_KEY === '') {
      console.warn('❌ No AI API key available, using fallback response');
      return of(this.translate.instant('CHATBOT.RESPONSES.AI_NO_RESPONSE'));
    }

    console.log('✅ Usando IA con contexto');
    const currentUser = this.authService.getCurrentUser();

    // Construir contexto con datos reales del usuario
    return this.buildUserContext(message, currentUser).pipe(
      switchMap(context => this.callAIWithContext(message, context))
    );
  }

  /**
   * Construye contexto del usuario con datos reales de la API
   */
  private buildUserContext(message: string, currentUser: any): Observable<string> {
    if (!currentUser?.id) {
      return of(`Usuario no autenticado. Plataforma: TextilFlow - conecta businessmen con suppliers.`);
    }

    const intent = this.analyzeIntent(message);
    let contextPromises: Observable<any>[] = [];

    // Obtener datos relevantes según la consulta
    if (intent.intent === 'check_batches' || message.toLowerCase().includes('lote')) {
      const endpoint = currentUser.role === 'businessman'
        ? `${environment.batchesEndpointPath}/businessman/${currentUser.id}`
        : `${environment.batchesEndpointPath}/supplier/${currentUser.id}`;
      contextPromises.push(this.makeApiCall(endpoint).pipe(catchError(() => of([]))));
    }

    if (intent.intent === 'find_suppliers' || message.toLowerCase().includes('proveedor')) {
      contextPromises.push(this.makeApiCall(environment.supplierEndpointPath).pipe(catchError(() => of([]))));
    }

    if (intent.intent === 'check_requests' || message.toLowerCase().includes('solicitud')) {
      const endpoint = currentUser.role === 'businessman'
        ? `${environment.businessSupplierRequests}/businessman/${currentUser.id}`
        : `${environment.businessSupplierRequests}/supplier/${currentUser.id}`;
      contextPromises.push(this.makeApiCall(endpoint).pipe(catchError(() => of([]))));
    }

    // Si no hay datos específicos que obtener, devolver contexto básico
    if (contextPromises.length === 0) {
      return of(`Usuario: ${currentUser.name}, Rol: ${currentUser.role}. Plataforma: TextilFlow para textiles.`);
    }

    // Combinar todos los datos
    return forkJoin(contextPromises).pipe(
      map(results => {
        let context = `Usuario: ${currentUser.name}, Rol: ${currentUser.role}. `;

        results.forEach((data, index) => {
          if (data && data.length > 0) {
            if (intent.intent === 'check_batches' && index === 0) {
              context += `Lotes: ${data.length} total. Estados: ${this.getSummary(data, 'status')}. `;
            } else if (intent.intent === 'find_suppliers' && index === 0) {
              context += `Proveedores disponibles: ${data.length}. Especializaciones: ${this.getSummary(data, 'specialization')}. `;
            } else if (intent.intent === 'check_requests' && index === 0) {
              context += `Solicitudes: ${data.length}. Estados: ${this.getSummary(data, 'status')}. `;
            }
          }
        });

        return context + 'Plataforma: TextilFlow conecta businessmen con suppliers de textiles.';
      })
    );
  }

  /**
   * Hace llamada a IA con contexto enriquecido usando Llama 3.1
   */
  private callAIWithContext(message: string, context: string): Observable<string> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.HF_API_KEY}`,
      'Content-Type': 'application/json'
    });

    const currentLang = this.translate.currentLang || 'es';
    const langInstruction = currentLang === 'es' ? 'Responde en español' : 'Respond in English';

    const systemPrompt = `${langInstruction}. Eres un asistente útil de TextilFlow, una plataforma que conecta businessmen con suppliers de textiles, los businessmen son personas que piden lotes para poderse conectar con un supplier tiene que enviarle un request, recien cuando el supplier acepte el requeste ese supplier comenzara a trabajar con el businesmen y el businesmen podra hacerle peticiones de lotes cuando quiera.

CONTEXTO DEL USUARIO:
${context}

INSTRUCCIONES:
- Usa los datos del contexto para dar respuestas precisas
- Si preguntan por lotes/envíos, usa los números reales del contexto
- Si el usuario es un supplier y pregunta por los businessmen indica como puede ver a sus businessman actuales
- Si el usuario es un businessmen indicale como puede conectar con algun supplier
- Si preguntan por solicitudes, usa los estados reales
- Sé conversacional, útil y profesional
- Máximo 150 palabras
- Si no tienes datos específicos, ofrece ayuda general sobre la plataforma`;

    const body = {
      model: this.MODEL_NAME,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    };

    return this.http.post<any>(this.HF_API_URL, body, { headers }).pipe(
      map(response => {
        console.log('Respuesta de Llama:', response); // Para debugging

        if (response?.choices?.[0]?.message?.content) {
          let generatedText = response.choices[0].message.content.trim();

          // Limitar longitud si es muy larga
          if (generatedText.length > 300) {
            generatedText = generatedText.substring(0, 300) + '...';
          }

          return generatedText;
        }

        return this.translate.instant('CHATBOT.RESPONSES.AI_NO_RESPONSE');
      }),
      catchError(error => {
        console.error('Error en API de Llama:', error);

        // Fallback: usar respuestas locales con datos reales si la IA falla
        const intent = this.analyzeIntent(message);
        if (intent.action === 'api_call') {
          return this.handleApiCall(intent);
        }

        if (error.status === 503) {
          return of(this.translate.instant('CHATBOT.RESPONSES.AI_LOADING'));
        } else if (error.status === 401) {
          return of(this.translate.instant('CHATBOT.RESPONSES.AI_AUTH_ERROR'));
        } else if (error.status === 429) {
          return of(this.translate.instant('CHATBOT.RESPONSES.AI_RATE_LIMIT'));
        }

        return of(this.translate.instant('CHATBOT.RESPONSES.AI_TEMP_ERROR'));
      })
    );
  }

  /**
   * Genera resumen de datos para el contexto
   */
  private getSummary(data: any[], field: string): string {
    const counts = data.reduce((acc, item) => {
      const value = item[field] || 'Sin especificar';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .slice(0, 3) // Solo mostrar top 3
      .map(([key, value]) => `${key}(${value})`)
      .join(', ');
  }
}
