// /src/app/core/components/theme-switcher/theme-switcher.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.css']
})
export class ThemeSwitcherComponent implements OnInit, OnDestroy {
  @Input() variant: 'radio' | 'buttons' | 'dropdown' = 'radio';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showLabels: boolean = true;
  @Input() fullWidth: boolean = false;

  currentTheme: ThemeMode = 'auto';
  private subscription = new Subscription();

  themeOptions: Array<{value: ThemeMode, icon: string, translationKey: string}> = [
    { value: 'light', icon: 'light_mode', translationKey: 'THEME_SWITCHER.LIGHT' },
    { value: 'dark', icon: 'dark_mode', translationKey: 'THEME_SWITCHER.DARK' },
    { value: 'auto', icon: 'brightness_auto', translationKey: 'THEME_SWITCHER.AUTO' }
  ];

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Suscribirse a cambios de tema
    this.subscription.add(
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme = theme;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onThemeChange(theme: ThemeMode): void {
    this.themeService.setTheme(theme);
  }

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onThemeChange(target.value as ThemeMode);
  }

  isSelected(theme: ThemeMode): boolean {
    return this.currentTheme === theme;
  }
}
