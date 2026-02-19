// =============================================
// Google Sheets API Integration
// Credenciais armazenadas no localStorage (nunca no código!)
// =============================================

const SheetsService = {
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',

    isInitialized: false,
    isSignedIn: false,
    tokenClient: null,

    // Get credentials from localStorage
    getConfig() {
        return {
            clientId: localStorage.getItem('sheets_client_id') || '',
            apiKey: localStorage.getItem('sheets_api_key') || '',
            spreadsheetId: localStorage.getItem('sheets_spreadsheet_id') || '',
        };
    },

    // Save credentials to localStorage
    saveConfig(clientId, apiKey, spreadsheetId) {
        if (clientId) localStorage.setItem('sheets_client_id', clientId);
        if (apiKey) localStorage.setItem('sheets_api_key', apiKey);
        if (spreadsheetId) localStorage.setItem('sheets_spreadsheet_id', spreadsheetId);
    },

    // Clear credentials
    clearConfig() {
        localStorage.removeItem('sheets_client_id');
        localStorage.removeItem('sheets_api_key');
        localStorage.removeItem('sheets_spreadsheet_id');
        this.isInitialized = false;
        this.isSignedIn = false;
    },

    // Check if configured
    isConfigured() {
        const config = this.getConfig();
        return !!(config.apiKey && config.spreadsheetId);
    },

    // Initialize the Google API (GAPI + GIS)
    async init() {
        const config = this.getConfig();
        if (!config.apiKey || !config.spreadsheetId) {
            console.log('⚠️ Google Sheets: Credenciais não configuradas. Vá em Configurações.');
            return false;
        }

        try {
            // Load GAPI
            await this.loadScript('https://apis.google.com/js/api.js');
            await new Promise((resolve) => gapi.load('client', resolve));
            await gapi.client.init({
                apiKey: config.apiKey,
                discoveryDocs: [this.DISCOVERY_DOC],
            });

            // Load GIS (Google Identity Services) for OAuth
            if (config.clientId) {
                await this.loadScript('https://accounts.google.com/gsi/client');
                this.tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: config.clientId,
                    scope: this.SCOPES,
                    callback: (response) => {
                        if (response.error) {
                            console.error('❌ Erro de autenticação:', response.error);
                            return;
                        }
                        this.isSignedIn = true;
                        console.log('✅ Autenticado com Google Sheets');
                    },
                });
            }

            this.isInitialized = true;
            console.log('✅ Google Sheets API inicializada');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar Google Sheets:', error);
            return false;
        }
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Sign in (request access token)
    signIn() {
        if (!this.tokenClient) {
            console.error('Client ID não configurado');
            return;
        }
        if (gapi.client.getToken() === null) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            this.tokenClient.requestAccessToken({ prompt: '' });
        }
    },

    // Sign out
    signOut() {
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.isSignedIn = false;
        }
    },

    // Read data from a sheet
    async readSheet(range) {
        if (!this.isInitialized) return null;
        const config = this.getConfig();

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: config.spreadsheetId,
                range: range,
            });
            return response.result.values;
        } catch (error) {
            console.error('Erro ao ler planilha:', error);
            return null;
        }
    },

    // Write data to a sheet (requires sign in)
    async writeSheet(range, values) {
        if (!this.isInitialized || !this.isSignedIn) {
            console.error('Precisa estar autenticado para escrever');
            return false;
        }
        const config = this.getConfig();

        try {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: config.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: { values: values },
            });
            return true;
        } catch (error) {
            console.error('Erro ao escrever na planilha:', error);
            return false;
        }
    },

    // Get connection status
    getStatus() {
        if (!this.isConfigured()) return 'not-configured';
        if (!this.isInitialized) return 'offline';
        if (!this.isSignedIn) return 'read-only';
        return 'connected';
    },

    getStatusLabel() {
        const labels = {
            'not-configured': '⚙️ Não configurado',
            'offline': '🔴 Offline',
            'read-only': '🟡 Somente leitura',
            'connected': '🟢 Conectado',
        };
        return labels[this.getStatus()] || 'Desconhecido';
    }
};

window.SheetsService = SheetsService;
