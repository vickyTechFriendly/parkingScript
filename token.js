require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function getToken() {
    const url = `https://data.apk2.es/api/login`;
    try {
        const response = await axios.post(url, {
            username: process.env.username,
            secret: process.env.secret,
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

async function updateTokenInScript () { 
    const data = await getToken();
    console.log(data); 


    const scriptContent = fs.readFileSync('parkingScript.js', 'utf8');
    const escapedToken = data.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); //escape para que no se interprete como regex
    const updatedScript = scriptContent.replace(/let nextToken = '.*';/, `let nextToken = '${escapedToken}';`);
    fs.writeFileSync('parkingScript.js', updatedScript, 'utf8');

    console.log("Token actualizado en parkingScript.js");

};

// Ejecutar una vez inmediatamente para asegurarse de que se actualice desde el principio
updateTokenInScript();

// Ejecutar la actualización
const intervalTime = 50 * 60 * 1000;
setInterval(async () => {
    await updateTokenInScript();
}, intervalTime);