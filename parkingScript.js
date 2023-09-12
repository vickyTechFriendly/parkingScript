require('dotenv').config();
const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//Token 
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
            console.log ("Error en la petición:", error.request);
        } else {
            console.error("Error al realizar la petición:", error.message);
        }
        throw error;
    }
}

const fechaActual = new Date();
const fechaAnterior =  5*60*1000;
const fecha = new Date(fechaActual.getTime() - fechaAnterior); 

//Petición http(get) a la API
 async function getOcupation(){
    let cecos = "B149;B156;B157";
    let from = fecha.toISOString().slice(0, 19).replace('T', ' '); 
    let to = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let nextToken = await getToken(); 
    const url = `https://data.apk2.es/api/parking-occupation/?cecos=${cecos}&from=${from}&to=${to}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${nextToken}`,
            },
    });
    return response.data;
    } catch (error) {
        if (error.response) {
            console.error("Error en la respuesta:", error.response.data);
        } else if (error.request) {
            console.log ("Error en la petición:", error.request);
        } else {
            console.error("Error al realizar la petición:", error.message);
        }
        throw error;
    }
} 
 
const plataforma = "smart.albacete.es";
const dispositivos = [
    {
      accessToken: process.env.tokenB156,
      id: "B156",
      totales: 749,
      abonados: 0,
      rotacional: 0,
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
    },
    {
      accessToken: process.env.tokenB157,
      id: "B157",
      totales: 298,
      abonados: 0,
      rotacional: 0,
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
    },
      {
      accessToken: process.env.tokenB156,
      id: "B149",
      totales: 225,
      abonados: 0,
      rotacional: 0, 
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
      }
  ]; 

  async function sendAttributes(dispositivo) {
    const attributes = {
        "totales": dispositivo.totales,
    };

    try {
        await axios.post(`https://${plataforma}/api/v1/${dispositivo.accessToken}/attributes`, attributes, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        if (error.response) {
            console.error("Error en la respuesta:", error.response.data);
        } else if (error.request) {
            console.log("Error en la petición:", error.request);
        } else {
            console.error("Error al realizar la petición:", error.message);
        }
        throw error;
    }
}

//Petición http(post) a la plataforma
async function sendTelemetry(dispositivo) {
    try { 
        const data = await getOcupation();
        const parkingDataMap = {};
        
              
        data.data.forEach(item => { 
            if (!parkingDataMap[item.parking] || new Date(item.time) > new Date(parkingDataMap[item.parking].time)) { 
                parkingDataMap[item.parking] = item; 
            }
        });

         const parkingData = parkingDataMap[dispositivo.id];
         
         if (parkingData) {
            dispositivo.abonados = parkingData.subscriber; 
            dispositivo.rotacional = parkingData.rotation; 
            dispositivo.id = parkingData.parking; 
        }
        dispositivo.libres = dispositivo.totales - dispositivo.abonados - dispositivo.rotacional;
        dispositivo.ocupado = dispositivo.totales - dispositivo.libres;
        dispositivo.ocupacion = dispositivo.ocupado * 100 / dispositivo.totales;
    
        const telemetryData = {

        abonados: dispositivo.abonados,
        rotacional: dispositivo.rotacional,
        libres: dispositivo.libres,
        ocupado: dispositivo.ocupado,
        ocupacion: dispositivo.ocupacion,
        };

        await axios.post(`https://${plataforma}/api/v1/${dispositivo.accessToken}/telemetry`, telemetryData,{
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
        console.log(`Datos de ${dispositivo.id} enviados correctamente`);
    } catch (error) {
        if (error.response) {
            console.error("Error en la respuesta:", error.response.data);
        } else if (error.request) {
            console.log ("Error en la petición:", error.request);
        } else {
            console.error("Error al realizar la petición:", error.message);
        }
        throw error;
    }
}

dispositivos.forEach(async dispositivo => {
    await sendTelemetry(dispositivo);
    await sendAttributes(dispositivo);
    
    setInterval(async() => { 
        try {
            await sendAttributes(dispositivo);
            await sendTelemetry(dispositivo);
        } catch (error) {
            console.error(`Error al cargar los datos de ${dispositivo.nombre}:`, error.message);
        }
    }, 300000);
}
);