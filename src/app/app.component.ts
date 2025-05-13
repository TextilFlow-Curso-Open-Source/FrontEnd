// /src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { SessionService } from './auth/services/session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'textil-flow';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Esto simplemente asegura que el AuthService se inicialice,
    // lo que a su vez inicializa el SessionService
  }
}
