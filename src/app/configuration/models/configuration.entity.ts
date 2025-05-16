export class Configuration {
    /**
     * Unique identifier for the configuration
     */
    id?: number;

    /**
     * User ID associated with this configuration
     */
    userId: number;

    /**
     * User role (businessman or supplier)
     */
    userRole: 'businessman' | 'supplier';

    /**
     * Theme preference (light or dark)
     */
    theme: 'light' | 'dark' = 'light';

    /**
     * Language preference
     */
    language: string = 'es';

    /**
     * Email notification settings
     */
    emailNotifications: boolean = true;

    /**
     * Push notification settings
     */
    pushNotifications: boolean = true;

    /**
     * Dashboard layout preferences
     */
    dashboardLayout: {
        showWelcomeMessage: boolean;
        defaultView: 'list' | 'grid' | 'calendar';
        widgetsOrder: string[];
    } = {
        showWelcomeMessage: true,
        defaultView: 'list',
        widgetsOrder: ['summary', 'recent', 'notifications']
    };

    /**
     * Privacy settings
     */
    privacySettings: {
        profileVisibility: 'public' | 'private' | 'contacts';
        shareData: boolean;
    } = {
        profileVisibility: 'public',
        shareData: true
    };

    /**
     * Date when the configuration was last updated
     */
    lastUpdated: Date = new Date();

    /**
     * Constructor for creating a new Configuration instance
     * 
     * @param userId - The ID of the user this configuration belongs to
     * @param userRole - The role of the user (businessman or supplier)
     * @param data - Optional partial configuration data to initialize with
     */
    constructor(userId: number, userRole: 'businessman' | 'supplier', data?: Partial<Configuration>) {
        this.userId = userId;
        this.userRole = userRole;
        
        // Apply any provided configuration data
        if (data) {
            Object.assign(this, data);
        }
        
        // Always set lastUpdated to current date when creating or updating
        this.lastUpdated = new Date();
    }

    /**
     * Updates the configuration with new values
     * 
     * @param updates - Partial configuration data to update
     * @returns The updated Configuration instance
     */
    update(updates: Partial<Configuration>): Configuration {
        Object.assign(this, updates);
        this.lastUpdated = new Date();
        return this;
    }

    /**
     * Resets configuration to default values while preserving userId and userRole
     * 
     * @returns The reset Configuration instance
     */
    resetToDefaults(): Configuration {
        const userId = this.userId;
        const userRole = this.userRole;
        const id = this.id;
        
        // Create a new instance with default values
        const defaultConfig = new Configuration(userId, userRole);
        
        // Preserve the ID if it exists
        if (id) {
            defaultConfig.id = id;
        }
        
        // Copy all properties from the default config
        Object.assign(this, defaultConfig);
        
        return this;
    }
}
