// app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { SessionService } from './auth/services/session.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TranslateModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'textil-flow';

  constructor(
    private authService: AuthService,
    private translateService: TranslateService
  ) {
    // Inicializar el servicio de traducción
    this.translateService.setDefaultLang('es');
    this.translateService.use('es');
  }

  ngOnInit() {

  }
}
