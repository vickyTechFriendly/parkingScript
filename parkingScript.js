require('dotenv').config();
const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

//config. para obtener los datos de los últimos 5 minutos
const fechaActual = new Date();
const fechaPrev = 5 * 60 * 1000;
const fecha = new Date(fechaActual.getTime() - fechaPrev);

//petición http(get) a la api
async function getOcupacion(){
    let cecos = "B149;B156;B157";
    let from = fecha.toISOString().slice(0, 19).replace('T', ' '); 
    let to = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let nextToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9\.eyJpYXQiOjE2OTI2MDIyNDQsImV4cCI6MTY5MjYwNTg0NCwicm9sZXMiOlsiUk9MRV9PQ0NVUEFUSU9OIl0sInVzZXJuYW1lIjoiYXl1bnRhbWllbnRvYWxiYWNldGUifQ\.2IrrfM6Pvqvsxxoesp7OzHtl0BeZZRO1zrU4oeovcFSii6o1Az\-WB8NFyuT\-tcN9rrcnDXRk3S2jcI2wJCi3ChX5D6z3xewP5nR_GZrQMtQdh8_PD\-8eBqetBAtg\-4qIMNy5frax4tqT\-bDSz5usDLXajWqQpx0vZG6yzAKOhqXDaf5WEfKJI4MA8aJGU_Oyfb4flSDq9D_QzOWeW0Y5hyabnIcVzXBnvCR7jAC6sB9Ave1ikQzDzHoqqw9izri8lNFlg8qDj_F7\-SlU46yA9kVMbGq\-d8qIjr0IXGiWK0ddn5MGfDZT5HzfxWNjchohhQBbYFvoWvm4CKf6ljBzs0tmuquG7Dtc9lGQFHUbuRFBDAJJHm3q78zsK4vbLV3qW8fYMB3gehQebLrQ25EfrD10sCIaqvPJNJEJyRNbzXIty7ug7yZj4O6KnVZbaYvBhNaByrqqHC2FB24C0ItiA2KcUzBs4w3Z00PiIqO1bHo3GmqKG00fd76amvpEOb8Gx8JlBpaPSbr5oPMWiwGJngYNXxDVGfXFQkTgM3YQo1R3ECS\-d2yPu_Wy4ES6lylGdeIoWiqsnvKB8HgyhhWDizcKYUD63cY0y7lwBnsuU6i3leBXZGsN3IoCYg74FvJsfdSTf03N5xTvieMMa9wuw8rEHs2UnJXwBOa0JicUj\-Y';
    const url = `https://data.apk2.es/api/parking-occupation/?cecos=${cecos}&from=${from}&to=${to}`;

    try{
        const response = await axios.get(url, { 
            headers: {
                Authorization: `Bearer ${nextToken}`, 
            },
        });
        return response.data;               
    } catch(error) {
        console.error("Error en la solicitud:", error);
        throw error;
    }
}

const plataforma = "smart.albacete.es";
const dispositivos = [
    {
      accessToken: "iZm0hf3yt1NuH7tcLDKV",
      latitude: 38.98705,
      longitude: -1.85437,
      id: "B156",
      totales: 749,
      nombre: "Avda. España",
      entrada: "Avda. de España 21",
      abonados: 0,
      rotacional: 0,
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
    },
    {
      accessToken: "LQkCw9qyujwKd0hzyDId",
      latitude: 38.99674,
      longitude: -1.85226,
      id: "B157",
      totales: 298,
      nombre: "Sembrador",
      entrada: "C/ Alcalde Conangla, Fuente de las ranas",
      abonados: 0,
      rotacional: 0,
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
    },
      {
      accessToken: "6esSOXeBJDESd55Ehlqz",
      latitude: 38.99649575842929,
      longitude: -1.8675078020171423,
      id: "B149",
      totales: 225,
      nombre: "Feria",
      entrada: "C/ Feria 109",
      abonados: 0,
      rotacional: 0, 
      libres: 0,
      ocupado: 0,
      ocupacion: 0,
      }
  ]; 

//definición de los datos que se enviarán a la plataforma + petición http(post) para enviarlos
async function publishTelemetry(dispositivo) {
    try { 
        const data = await getOcupacion(); 
        const parkingDataMap = {}; 
        
        // Iterar sobre los datos de la API para quedarme con la fecha más reciente por parking        
        data.data.forEach(item => {
            if (!parkingDataMap[item.parking] || new Date(item.time) > new Date(parkingDataMap[item.parking].time)) { //si no existe el parking o la fecha es mayor que la del parking
                parkingDataMap[item.parking] = item; //se guarda el parking en el mapa de datos de parking 
            }
        });

         const parkingData = parkingDataMap[dispositivo.id];
        if(parkingData) { //si existe el parking en el mapa de datos de parking 
            dispositivo.abonados = parkingData.subscriber; //se guarda el número de abonados en el dispositivo 
            dispositivo.rotacional = parkingData.rotation; //se guarda el número de rotacionales en el dispositivo
            dispositivo.id = parkingData.parking; //se guarda el id del parking en el dispositivo
        }
        dispositivo.libres = dispositivo.totales - dispositivo.abonados - dispositivo.rotacional;
        console.log(`Dispositivo ${dispositivo.id} tiene ${dispositivo.abonados} abonados y ${dispositivo.rotacional} rotacionales y es el parking ${parkingData.parking}`);
        dispositivo.ocupado = dispositivo.totales - dispositivo.libres;
        dispositivo.ocupacion = dispositivo.ocupado * 100 / dispositivo.totales;
    
        const telemetryData = {
        latitude: dispositivo.latitude,
        longitude: dispositivo.longitude,
        id: dispositivo.id,  
        totales: dispositivo.totales,
        nombre: dispositivo.nombre,
        entrada: dispositivo.entrada,

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
        console.log(`¡Datos de ${dispositivo.nombre} enviados correctamente!`);
    } catch (error) {
        console.error(`Error al enviar los datos de ${dispositivo.nombre}:`, error.message);
    }
}

// Definición del intervalo de tiempo para cargar los datos en la plataforma (cada 5 minutos)
dispositivos.forEach(async dispositivo => { 
    console.log(`Cargando los datos telemétricos de ${dispositivo.nombre} cada 5 minutos...`);
    await publishTelemetry(dispositivo); 
    console.log(dispositivo)
    
    setInterval(async() => { 
        console.log(`Los datos de ${dispositivo.nombre} se están cargando correctamente`);
        await publishTelemetry(dispositivo);
        //console.log(dispositivo) //si quiero ver los datos que se están enviando en la consola
}, 300000);
});