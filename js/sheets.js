// =============================================
// Google Sheets API Integration
// API Key restrita ao domínio gabriel-steixeira.github.io
// =============================================

const SheetsService = {
    // Credenciais (API Key restrita por domínio no Google Cloud Console)
    CLIENT_ID: '354544034041-ed6s58ldaj9gdg22rjh5harfvpj60ooq.apps.googleusercontent.com',
    API_KEY: 'AIzaSyBNHupgWFLbLQX-PLcsg6jpKXGPRD9E4b0',
    SPREADSHEET_ID: '1hLCMrxviOqD3KRGInlHlApVIMgHEMQKoycv5v67k4LY',
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
    DISCOVERY_DOC: 'https://sheets.googleapis.com/$discovery/rest?version=v4',

    isInitialized: false,
    isSignedIn: false,
    tokenClient: null,

    getConfig() {
        return {
            clientId: this.CLIENT_ID,
            apiKey: this.API_KEY,
            spreadsheetId: this.SPREADSHEET_ID,
        };
    },

    isConfigured() {
        return true;
    },

    // Initialize the Google API (GAPI + GIS)
    async init() {
        try {
            // Load GAPI
            await this.loadScript('https://apis.google.com/js/api.js');
            await new Promise((resolve) => gapi.load('client', resolve));
            await gapi.client.init({
                apiKey: this.API_KEY,
                discoveryDocs: [this.DISCOVERY_DOC],
            });

            // Load GIS (Google Identity Services) for OAuth
            await this.loadScript('https://accounts.google.com/gsi/client');
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
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

        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
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

        try {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.SPREADSHEET_ID,
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
        if (!this.isInitialized) return 'offline';
        if (!this.isSignedIn) return 'read-only';
        return 'connected';
    },

    getStatusLabel() {
        const labels = {
            'offline': '🔴 Offline',
            'read-only': '🟡 Somente leitura',
            'connected': '🟢 Conectado',
        };
        return labels[this.getStatus()] || 'Desconhecido';
    }
};

window.SheetsService = SheetsService;
