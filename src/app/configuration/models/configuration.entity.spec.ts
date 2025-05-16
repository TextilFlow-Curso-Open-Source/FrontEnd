import { Configuration } from './configuration.entity';

describe('Configuration', () => {
  let userId: number;
  let userRole: 'businessman' | 'supplier';

  beforeEach(() => {
    userId = 1;
    userRole = 'businessman';
  });

  it('should create an instance', () => {
    expect(new Configuration(userId, userRole)).toBeTruthy();
  });

  it('should initialize with default values', () => {
    const config = new Configuration(userId, userRole);
    
    expect(config.userId).toBe(userId);
    expect(config.userRole).toBe(userRole);
    expect(config.theme).toBe('light');
    expect(config.language).toBe('es');
    expect(config.emailNotifications).toBe(true);
    expect(config.pushNotifications).toBe(true);
    expect(config.dashboardLayout.showWelcomeMessage).toBe(true);
    expect(config.dashboardLayout.defaultView).toBe('list');
    expect(config.dashboardLayout.widgetsOrder).toEqual(['summary', 'recent', 'notifications']);
    expect(config.privacySettings.profileVisibility).toBe('public');
    expect(config.privacySettings.shareData).toBe(true);
    expect(config.lastUpdated).toBeInstanceOf(Date);
  });

  it('should initialize with provided values', () => {
    const customData = {
      theme: 'dark' as 'light' | 'dark',
      language: 'en',
      emailNotifications: false
    };
    
    const config = new Configuration(userId, userRole, customData);
    
    expect(config.userId).toBe(userId);
    expect(config.userRole).toBe(userRole);
    expect(config.theme).toBe('dark');
    expect(config.language).toBe('en');
    expect(config.emailNotifications).toBe(false);
    expect(config.pushNotifications).toBe(true); // Default value
  });

  it('should update properties correctly', () => {
    const config = new Configuration(userId, userRole);
    const updates = {
      theme: 'dark' as 'light' | 'dark',
      language: 'en',
      dashboardLayout: {
        showWelcomeMessage: false,
        defaultView: 'grid' as 'list' | 'grid' | 'calendar',
        widgetsOrder: ['notifications', 'summary', 'recent']
      }
    };
    
    const updatedConfig = config.update(updates);
    
    expect(updatedConfig).toBe(config); // Should return the same instance
    expect(config.theme).toBe('dark');
    expect(config.language).toBe('en');
    expect(config.dashboardLayout.showWelcomeMessage).toBe(false);
    expect(config.dashboardLayout.defaultView).toBe('grid');
    expect(config.dashboardLayout.widgetsOrder).toEqual(['notifications', 'summary', 'recent']);
    expect(config.lastUpdated).toBeInstanceOf(Date);
  });

  it('should reset to default values while preserving userId and userRole', () => {
    const config = new Configuration(userId, userRole, {
      id: 123,
      theme: 'dark' as 'light' | 'dark',
      language: 'en',
      emailNotifications: false,
      pushNotifications: false,
      dashboardLayout: {
        showWelcomeMessage: false,
        defaultView: 'grid' as 'list' | 'grid' | 'calendar',
        widgetsOrder: ['notifications', 'summary']
      },
      privacySettings: {
        profileVisibility: 'private' as 'public' | 'private' | 'contacts',
        shareData: false
      }
    });
    
    const resetConfig = config.resetToDefaults();
    
    expect(resetConfig).toBe(config); // Should return the same instance
    expect(config.id).toBe(123); // ID should be preserved
    expect(config.userId).toBe(userId); // userId should be preserved
    expect(config.userRole).toBe(userRole); // userRole should be preserved
    
    // These should be reset to defaults
    expect(config.theme).toBe('light');
    expect(config.language).toBe('es');
    expect(config.emailNotifications).toBe(true);
    expect(config.pushNotifications).toBe(true);
    expect(config.dashboardLayout.showWelcomeMessage).toBe(true);
    expect(config.dashboardLayout.defaultView).toBe('list');
    expect(config.dashboardLayout.widgetsOrder).toEqual(['summary', 'recent', 'notifications']);
    expect(config.privacySettings.profileVisibility).toBe('public');
    expect(config.privacySettings.shareData).toBe(true);
    expect(config.lastUpdated).toBeInstanceOf(Date);
  });
});
