import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterModule], // ← Esto es clave
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent {

  constructor(private router: Router) {}

  getHomeRoute(): string {
    const currentUrl = this.router.url;

    if (currentUrl.includes('/businessman')) {
      return '/businessman/inicio';
    } else if (currentUrl.includes('/supplier')) {
      return '/supplier/inicio';
    } else {
      return '/login';
    }
  }
}
