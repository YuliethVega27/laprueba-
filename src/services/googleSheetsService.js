import { google } from 'googleapis';

const sheets = google.sheets('v4');

async function addRowToSheet(auth, spreadsheetId, values) {
    const request = {
        spreadsheetId,
        range: 'reservas', // Nombre de la hoja
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [values],
        },
        auth,
    };

    try {
        const response = await sheets.spreadsheets.values.append(request);
        return response;
    } catch (error) {
        console.error('Error al añadir datos a la hoja:', error);
    }
}

const appendToSheet = async (data) => {
    try {
        // Configuración del cliente de autenticación utilizando variables de entorno
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: process.env.TYPE,
                project_id: process.env.PROJECT_ID,
                private_key_id: process.env.PRIVATE_KEY_ID,
                private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'), // Asegúrate de que las nuevas líneas estén correctamente formateadas
                client_email: process.env.CLIENT_EMAIL,
                client_id: process.env.CLIENT_ID,
                auth_uri: process.env.AUTH_URI,
                token_uri: process.env.TOKEN_URI,
                auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.CLIENT_X509_CERT_URL
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const authClient = await auth.getClient(); // Obtener el cliente autenticado
        const spreadsheetId = '1dDDArNS2U22QthZHMJa2IiPX53pTkjUIPPuvGQ8fp7U'; // ID de tu hoja de cálculo
        await addRowToSheet(authClient, spreadsheetId, data);
        return 'Datos correctamente agregados';
    } catch (error) {
        console.error('Error al acceder a Google Sheets:', error);
    }
}

export default appendToSheet;
