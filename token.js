require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function getToken() {
    const url = `https://data.apk2.es/api/login`;
    try {
        const response = await axios.post(url, {
            username: 'ayuntamientoalbacete',
            secret: 'f1bdef58e9e0a23f77e8f31bfb3b451fca41dfb53b65292395018d0e6b85427c',
        });
        return response.data.token;
    } catch (error) {
        if (error.response) {
            console.error("Error en la respuesta:", error.response.data);
        } else if (error.request) {
            console.error("No se recibió respuesta del servidor");
        } else {
            console.error("Error al realizar la solicitud:", error.message);
        }
        throw error;
    }
}

async function updateTokenInScript() {
    const data = await getToken();
    console.log("Nuevo Token: ", data); 
    const scriptContent = fs.readFileSync('parkingScript.js', 'utf8');
    const updatedScript = scriptContent.replace(/let nextToken = '.*';/, `let nextToken = '${data}';`);
    fs.writeFileSync('parkingScript.js', updatedScript, 'utf8');

    console.log("Token actualizado en parkingScript.js");
}

// Ejecutar la actualización cada 55 minutos: 3300000 ms
setInterval(updateTokenInScript, 3300000);