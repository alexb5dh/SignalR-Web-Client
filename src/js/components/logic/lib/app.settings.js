import { AppEvents } from './app.common';

class SettingsManager {
    constructor() {
        this.storageKey = 'signalr-web-client-settings';
        this.defaultSettings = {
            hubUrl: 'https://localhost:5001/Test/Hub',
            authMethod: 'none',
            authToken: '',
            transportType: 'ws',
            serializationType: 'json',
            skipNegotiation: false,
            loggerView: false,
            viewMode: 'basic', // 'basic' or 'advance'
            muteNotification: false
        };
    }

    /**
     * Save all current settings to localStorage
     */
    saveSettings(settings) {
        try {
            const settingsToSave = { ...this.defaultSettings, ...settings };
            localStorage.setItem(this.storageKey, JSON.stringify(settingsToSave));
            AppEvents.emit('Logger', 'Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            AppEvents.emit('Logger', `Failed to save settings: ${error.message}`);
        }
    }

    /**
     * Load all settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem(this.storageKey);
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Merge with defaults to handle any missing properties
                return { ...this.defaultSettings, ...parsedSettings };
            }
            return { ...this.defaultSettings };
        } catch (error) {
            console.error('Failed to load settings:', error);
            AppEvents.emit('Logger', `Failed to load settings: ${error.message}`);
            return { ...this.defaultSettings };
        }
    }

    /**
     * Save a specific setting
     */
    saveSetting(key, value) {
        const currentSettings = this.loadSettings();
        currentSettings[key] = value;
        this.saveSettings(currentSettings);
    }

    /**
     * Get a specific setting
     */
    getSetting(key) {
        const settings = this.loadSettings();
        return settings[key];
    }

    /**
     * Clear all saved settings
     */
    clearSettings() {
        try {
            localStorage.removeItem(this.storageKey);
            AppEvents.emit('Logger', 'Settings cleared successfully');
        } catch (error) {
            console.error('Failed to clear settings:', error);
            AppEvents.emit('Logger', `Failed to clear settings: ${error.message}`);
        }
    }

    /**
     * Apply settings to the UI elements
     */
    applySettingsToUI(settings) {
        console.log('Applying settings to UI:', settings);
        
        // Hub URL
        const urlElement = document.getElementById('inputUrl');
        if (urlElement && settings.hubUrl) {
            urlElement.value = settings.hubUrl;
            console.log('Set hub URL to:', settings.hubUrl);
        }

        // Auth method
        const authMethodElement = document.getElementById('auth-method');
        if (authMethodElement && settings.authMethod) {
            authMethodElement.value = settings.authMethod;
            // Trigger change event to update UI state
            authMethodElement.dispatchEvent(new Event('change'));
        }

        // Auth token
        const authTokenElement = document.getElementById('authHeader');
        if (authTokenElement && settings.authToken) {
            authTokenElement.value = settings.authToken;
        }

        // Transport type
        const transportElement = document.getElementById('transport-type');
        if (transportElement && settings.transportType) {
            transportElement.value = settings.transportType;
        }

        // Serialization type
        const serializationElement = document.getElementById('serialization-type');
        if (serializationElement && settings.serializationType) {
            serializationElement.value = settings.serializationType;
            // Trigger change event to update app logic
            serializationElement.dispatchEvent(new Event('change'));
        }

        // Skip negotiation
        const skipNegotiationElement = document.getElementById('chk-skip-negotiation');
        if (skipNegotiationElement) {
            skipNegotiationElement.checked = settings.skipNegotiation;
            // Trigger change event to update internal state
            skipNegotiationElement.dispatchEvent(new Event('change'));
        }

        // Logger view
        const loggerElement = document.getElementById('chk-loggerView');
        if (loggerElement) {
            loggerElement.checked = settings.loggerView;
            // Trigger change event to show/hide logger
            loggerElement.dispatchEvent(new Event('change'));
        }

        // View mode - we'll handle this after the DOM is fully ready
        // The tab change will be triggered by the srform.js logic

        // Notification mute (already handled in existing code)
        const muteElement = document.getElementById('chk-mute-notification');
        if (muteElement) {
            muteElement.checked = settings.muteNotification;
        }
    }

    /**
     * Collect current settings from UI elements
     */
    collectSettingsFromUI() {
        const settings = {};

        // Hub URL
        const urlElement = document.getElementById('inputUrl');
        if (urlElement) {
            settings.hubUrl = urlElement.value;
        }

        // Auth method
        const authMethodElement = document.getElementById('auth-method');
        if (authMethodElement) {
            settings.authMethod = authMethodElement.value;
        }

        // Auth token
        const authTokenElement = document.getElementById('authHeader');
        if (authTokenElement) {
            settings.authToken = authTokenElement.value;
        }

        // Transport type
        const transportElement = document.getElementById('transport-type');
        if (transportElement) {
            settings.transportType = transportElement.value;
        }

        // Serialization type
        const serializationElement = document.getElementById('serialization-type');
        if (serializationElement) {
            settings.serializationType = serializationElement.value;
        }

        // Skip negotiation
        const skipNegotiationElement = document.getElementById('chk-skip-negotiation');
        if (skipNegotiationElement) {
            settings.skipNegotiation = skipNegotiationElement.checked;
        }

        // Logger view
        const loggerElement = document.getElementById('chk-loggerView');
        if (loggerElement) {
            settings.loggerView = loggerElement.checked;
        }

        // View mode
        const activeTab = document.querySelector('.nav-link.active');
        if (activeTab) {
            settings.viewMode = activeTab.getAttribute('data-tab-type');
        }

        // Notification mute
        const muteElement = document.getElementById('chk-mute-notification');
        if (muteElement) {
            settings.muteNotification = muteElement.checked;
        }

        return settings;
    }

    /**
     * Auto-save settings when they change
     */
    enableAutoSave() {
        // Hub URL changes
        const urlElement = document.getElementById('inputUrl');
        if (urlElement) {
            urlElement.addEventListener('input', () => {
                this.saveSetting('hubUrl', urlElement.value);
            });
        }

        // Auth method changes
        const authMethodElement = document.getElementById('auth-method');
        if (authMethodElement) {
            authMethodElement.addEventListener('change', () => {
                this.saveSetting('authMethod', authMethodElement.value);
            });
        }

        // Auth token changes
        const authTokenElement = document.getElementById('authHeader');
        if (authTokenElement) {
            authTokenElement.addEventListener('input', () => {
                this.saveSetting('authToken', authTokenElement.value);
            });
        }

        // Transport type changes
        const transportElement = document.getElementById('transport-type');
        if (transportElement) {
            transportElement.addEventListener('change', () => {
                this.saveSetting('transportType', transportElement.value);
            });
        }

        // Serialization type changes
        const serializationElement = document.getElementById('serialization-type');
        if (serializationElement) {
            serializationElement.addEventListener('change', () => {
                this.saveSetting('serializationType', serializationElement.value);
            });
        }

        // Skip negotiation changes
        const skipNegotiationElement = document.getElementById('chk-skip-negotiation');
        if (skipNegotiationElement) {
            skipNegotiationElement.addEventListener('change', () => {
                this.saveSetting('skipNegotiation', skipNegotiationElement.checked);
            });
        }

        // Logger view changes
        const loggerElement = document.getElementById('chk-loggerView');
        if (loggerElement) {
            loggerElement.addEventListener('change', () => {
                this.saveSetting('loggerView', loggerElement.checked);
            });
        }

        // Tab changes (view mode) - handled in srform.js

        // Notification mute changes - already handled in existing code
    }
}

// Create a singleton instance
const settingsManager = new SettingsManager();

export { settingsManager as SettingsManager }; 