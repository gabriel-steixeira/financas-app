// =============================================
// Google Sheets API Integration
// Client ID: 354544034041-ed6s58ldaj9gdg22rjh5harfvpj60ooq.apps.googleusercontent.com
// =============================================

const SheetsService = {
    CLIENT_ID: '354544034041-ed6s58ldaj9gdg22rjh5harfvpj60ooq.apps.googleusercontent.com',
    API_KEY: '', // User needs to add their API Key here
    SPREADSHEET_ID: '', // User needs to add their Spreadsheet ID here
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

    isInitialized: false,
    isSignedIn: false,

    // Initialize the Google API
    async init() {
        if (!this.API_KEY || !this.SPREADSHEET_ID) {
            console.log('⚠️ Google Sheets: API_KEY ou SPREADSHEET_ID não configurados. Usando dados offline.');
            return false;
        }

        try {
            await this.loadGapiScript();
            await gapi.client.init({
                apiKey: this.API_KEY,
                clientId: this.CLIENT_ID,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                scope: this.SCOPES
            });

            this.isInitialized = true;
            this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

            // Listen for sign-in state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn) => {
                this.isSignedIn = isSignedIn;
            });

            console.log('✅ Google Sheets API inicializada');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar Google Sheets:', error);
            return false;
        }
    },

    loadGapiScript() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                gapi.load('client:auth2', resolve);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => gapi.load('client:auth2', resolve);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Sign in
    async signIn() {
        if (!this.isInitialized) return false;
        try {
            await gapi.auth2.getAuthInstance().signIn();
            return true;
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            return false;
        }
    },

    // Sign out
    signOut() {
        if (!this.isInitialized) return;
        gapi.auth2.getAuthInstance().signOut();
    },

    // Read data from a sheet
    async readSheet(range) {
        if (!this.isInitialized || !this.isSignedIn) return null;

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

    // Write data to a sheet
    async writeSheet(range, values) {
        if (!this.isInitialized || !this.isSignedIn) return false;

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
        if (!this.API_KEY || !this.SPREADSHEET_ID) return 'not-configured';
        if (!this.isInitialized) return 'offline';
        if (!this.isSignedIn) return 'signed-out';
        return 'connected';
    }
};

window.SheetsService = SheetsService;
