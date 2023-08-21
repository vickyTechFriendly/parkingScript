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
    let nextToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9\.eyJpYXQiOjE2OTI2MTc5MDEsImV4cCI6MTY5MjYyMTUwMSwicm9sZXMiOlsiUk9MRV9PQ0NVUEFUSU9OIl0sInVzZXJuYW1lIjoiYXl1bnRhbWllbnRvYWxiYWNldGUifQ\.RDpHcYmIv0\-vW6FB38lBreQvx6ij6eJiYzz2wZckSbO2OuZFbKsuBeOoeci8HkTyYRUgOGNb4E1013kWCD8APWK_gMMHFo4qQXdiIWdD_WULsFugvB74sz3UJd8aJtJgRaXGjNfHHqvQQYTi1gE7oCuf9WMFztFtWlL9zI6i\-ieuXLia6MkEnmREVidHub7fC6AGJdI80jF4PeOwFKI0SN6JUvP6h89Ta52vJ\-TSohjeaMHOCbOYZhtlrGcs9\-cbBREgu2YVAAmo0M83tC6mKLc0LHvPAUpyd4qamHC5apchm8fEsjxlFyTcHKYOUhVFoaKe8b7SuX80KiQeOsI4QQQSUL_ZHVCJg4fdxns2rT2923MsiXjmyCQ1FKs9BN9Ha4Se9AG\-Ym9JOndJ37TaQjoj7JFXK5ehE8WcUgZDMHmeNsV_hEOKIuDET0k8AHi1byvWEr_mdxQDsKmzNFbTpAJ2SLCzxkgrwkjyqUwE9qToOfd9SWGZKeImRRPoP2ENn6_zS\-ziGyd_jC2R81mc1ZZ\-7qBOx1W2GyUWAPYpqeb9VBVCp1ZuensCwWFizy68M67Ke2h37xNA33if5qYA6ftXInsZrrVRw\-zDPMMgnjEfFLwC8D5Y3dWZ06gtR4EeEfJP9T8LKk0kx9Um_VxCqc6F357t3rgWdMIjBKAtHe8';
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