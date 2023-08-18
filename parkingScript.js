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
    let nextToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE2OTIzNTc1OTYsImV4cCI6MTY5MjM2MTE5Niwicm9sZXMiOlsiUk9MRV9PQ0NVUEFUSU9OIl0sInVzZXJuYW1lIjoiYXl1bnRhbWllbnRvYWxiYWNldGUifQ.pIQoXgzakZ1IVRBhks8Hu3yqwIDb61UAVYMjipx17CK_7NT8_4Vi0Jj6ZoqI6xwycA1Vwc5OdYowsyNvjmLJ8Iw7RY9lUQDt64SWUvVlzMex2kRmtOLeRNgw2IM43cnnJsGfa1GLUhabUl7OUbI92kVk3adZgtyv0xysCiqqgxDuJpMNycGhAmNOyORd63-unhJR6aNcYRV7WyFVGxJMnU_BluebZBzxUGmGE-keGdKBJprmtmQoG8fY7yauk-GoZ0-SRxLcGg02P1Nc2POK9q_udVTY96o_hBvZh2WzVGpK_1ef5ieZieYcUNxT2sd-wKPJ_yYdYswBSzXj3ZJvulQBwG9-s6LriweuOMBp0a6ngE91xpS4i2xp-JlKdAbMDKkbTh4nVDZeTI0UGDWNE0RstLP1E5xCWWdlnvaAGD3Fd5t9LKb2d6GU3GoI_e54qbjY5s42HTZ1Jim8HxNtBGQzSqvENSHwCXWOgSofiCmhi2q4fYDt1XAG05zNeM85_Oxzvf7RbtT-DiAWOWVo4GS_AOS0o-UkerhcMC11D2OopAUbyleMfkAA4OD2qpc_PtbrZN1PHpPiMK0Nd-Ob0vLkxtQdM9SECDaVGgq9K2S0BeP7MQak3h3jSYZ8v4_r8TxT3JZFb8iB4L8buNMUA_fnvamC76vbzy_HmQHK3co';
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