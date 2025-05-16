import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfigurationServiceService } from '../../services/configuration.service.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Configuration } from '../../models/configuration.entity';
import { Router } from '@angular/router';

@Component({
  selector: 'app-businessman-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './businessman-configuration.component.html',
  styleUrl: './businessman-configuration.component.css'
})
export class BusinessmanConfigurationComponent implements OnInit {
  configForm!: FormGroup;
  userId!: number;
  userRole: 'businessman' | 'supplier' = 'businessman';
  configuration!: Configuration;
  isSaving = false;
  saveSuccess = false;
  saveError = false;

  constructor(
    private fb: FormBuilder,
    private configService: ConfigurationServiceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userId = currentUser.id;
    this.userRole = currentUser.role as 'businessman' | 'supplier';

    // Initialize form
    this.configForm = this.fb.group({
      theme: ['light', Validators.required],
      language: ['es', Validators.required],
      emailNotifications: [true],
      pushNotifications: [true],
      dashboardLayout: this.fb.group({
        showWelcomeMessage: [true],
        defaultView: ['list'],
        widgetsOrder: [['summary', 'recent', 'notifications']]
      }),
      privacySettings: this.fb.group({
        profileVisibility: ['public'],
        shareData: [true]
      })
    });

    // Load user configuration
    this.loadConfiguration();
  }

  loadConfiguration(): void {
    this.configService.getUserConfiguration(this.userId, this.userRole)
      .subscribe({
        next: (config) => {
          this.configuration = config;
          this.updateFormWithConfig(config);
        },
        error: (error) => {
          console.error('Error loading configuration:', error);
          // Create a default configuration if none exists
          this.configuration = new Configuration(this.userId, this.userRole);
        }
      });
  }

  updateFormWithConfig(config: Configuration): void {
    this.configForm.patchValue({
      theme: config.theme,
      language: config.language,
      emailNotifications: config.emailNotifications,
      pushNotifications: config.pushNotifications,
      dashboardLayout: {
        showWelcomeMessage: config.dashboardLayout.showWelcomeMessage,
        defaultView: config.dashboardLayout.defaultView,
        widgetsOrder: config.dashboardLayout.widgetsOrder
      },
      privacySettings: {
        profileVisibility: config.privacySettings.profileVisibility,
        shareData: config.privacySettings.shareData
      }
    });
  }

  saveConfiguration(): void {
    if (this.configForm.invalid) {
      return;
    }

    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = false;

    // Update configuration with form values
    const updatedConfig = new Configuration(this.userId, this.userRole, {
      ...this.configuration,
      ...this.configForm.value,
      lastUpdated: new Date()
    });

    // Save configuration
    this.configService.saveConfiguration(updatedConfig)
      .subscribe({
        next: (savedConfig) => {
          this.configuration = savedConfig;
          this.isSaving = false;
          this.saveSuccess = true;
          setTimeout(() => this.saveSuccess = false, 3000);
        },
        error: (error) => {
          console.error('Error saving configuration:', error);
          this.isSaving = false;
          this.saveError = true;
          setTimeout(() => this.saveError = false, 3000);
        }
      });
  }

  resetConfiguration(): void {
    if (confirm('¿Estás seguro de que deseas restablecer la configuración a los valores predeterminados?')) {
      this.configService.resetConfiguration(this.userId, this.userRole)
        .subscribe({
          next: (resetConfig) => {
            this.configuration = resetConfig;
            this.updateFormWithConfig(resetConfig);
            this.saveSuccess = true;
            setTimeout(() => this.saveSuccess = false, 3000);
          },
          error: (error) => {
            console.error('Error resetting configuration:', error);
            this.saveError = true;
            setTimeout(() => this.saveError = false, 3000);
          }
        });
    }
  }
}
