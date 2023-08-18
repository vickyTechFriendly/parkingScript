require('dotenv').config();
const axios = require('axios');

async function getToken() {
    const url = `https://data.apk2.es/api/login`;
    try {
        const response = await axios.post(url, {
            username: process.env.username,
            secret: process.env.secret,
        });
        return response.data;
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


(async () => { 
    const data = await getToken();
    console.log(data); 
}
)();

