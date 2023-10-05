import os
import requests
import json
import datetime
import time

# Configura el archivo .env
from dotenv import load_dotenv
load_dotenv()

# Token
def get_token():
    try:
        with open('tokensi.txt', 'r') as file:
            data = file.read()
            
        os.remove('tokensi.txt')
        return data
    except Exception as e:
        print(e)
    
    url = "https://data.apk2.es/api/login"
    try:
        response = requests.post(url, json={
            "username": os.getenv("username"),
            "secret": os.getenv("secret")
        })
        response_data = response.json()
        return response_data["token"]
    except requests.exceptions.RequestException as error:
        if hasattr(error, "response") and error.response:
            print("Error en la respuesta del Token:", error.response.json())
        else:
            print("Error al realizar la petición:", error)
        raise error

current_date = datetime.datetime.now()
delta = datetime.timedelta(hours=2)
current_date = current_date - delta
previous_date = current_date - datetime.timedelta(minutes=5)


# Petición HTTP (GET) a la API
def get_occupation():
    cecos = "B149;B156;B157"
    from_time = previous_date.strftime("%Y-%m-%d %H:%M:%S")
    to_time = current_date.strftime("%Y-%m-%d %H:%M:%S")
   
    next_token = get_token()
    
    url = f"https://data.apk2.es/api/parking-occupation/?cecos={cecos}&from={from_time}&to={to_time}"
    
    try:
        headers = {
            "Authorization": f"Bearer {next_token}"
        }
        
        response = requests.get(url, headers=headers)
        response_data = response.json()
        

        if response_data.get("nextToken") is not None:
            with open("tokensi.txt", "w") as file:
                file.write(response_data["nextToken"])

        print("Datos obtenidos de la API:", response_data)
        return response_data
    except requests.exceptions.RequestException as error:
        if hasattr(error, "response") and error.response:
            print("Error en la respuesta de la API:", error.response.json())
        else:
            print("Error al realizar la petición:", error)
        raise error

platform = "plataforma:9090"

devices = [
    {
        "accessToken": os.getenv("tokenB156"),
        "id": "B156",
        "totales": 749,
        "abonados": 0,
        "rotacional": 0,
        "libres": 0,
        "ocupado": 0,
        "ocupacion": 0
    },
    {
        "accessToken": os.getenv("tokenB157"),
        "id": "B157",
        "totales": 298,
        "abonados": 0,
        "rotacional": 0,
        "libres": 0,
        "ocupado": 0,
        "ocupacion": 0
    },
    {
        "accessToken": os.getenv("tokenB149"),
        "id": "B149",
        "totales": 225,
        "abonados": 0,
        "rotacional": 0,
        "libres": 0,
        "ocupado": 0,
        "ocupacion": 0
    }
]

# Petición HTTP (POST) a la plataforma
def send_attributes(dispositivo):
    attributes = {
        "totales": dispositivo["totales"]
    }
    try:
        headers = {
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        url = f"https://{platform}/api/v1/{dispositivo['accessToken']}/attributes"
        response = requests.post(url, json=attributes, headers=headers, verify=False)
        response.raise_for_status()
    except requests.exceptions.RequestException as error:
        if hasattr(error, "response") and error.response:
            print("Error en la respuesta de los Atributos:", error.response.json())
        else:
            print("Error al realizar la petición:", error)
        raise error

# Petición HTTP (POST) a la plataforma
def send_telemetry(dispositivo):
    try:
        data = get_occupation()
        parking_data_map = {}
        
        for item in data["data"]:
            if item["parking"] not in parking_data_map or datetime.datetime.fromisoformat(item["time"]).strftime("%Y-%m-%d %H:%M:%S") > datetime.datetime.fromisoformat(parking_data_map[item["parking"]]["time"]).strftime("%Y-%m-%d %H:%M:%S"):
                parking_data_map[item["parking"]] = item

        parking_data = parking_data_map[dispositivo["id"]]

        if parking_data:
            dispositivo["abonados"] = parking_data["subscriber"]
            dispositivo["rotacional"] = parking_data["rotation"]
            dispositivo["id"] = parking_data["parking"]

        dispositivo["libres"] = dispositivo["totales"] - dispositivo["abonados"] - dispositivo["rotacional"]
        dispositivo["ocupado"] = dispositivo["totales"] - dispositivo["libres"]
        dispositivo["ocupacion"] = dispositivo["ocupado"] * 100 / dispositivo["totales"]

        telemetry_data = {
            "abonados": dispositivo["abonados"],
            "rotacional": dispositivo["rotacional"],
            "libres": dispositivo["libres"],
            "ocupado": dispositivo["ocupado"],
            "ocupacion": dispositivo["ocupacion"]
        }
        print("Datos enviados a la plataforma:", telemetry_data)

        headers = {
            "accept": "application/json",
            "Content-Type": "application/json"
        }
        url = f"https://{platform}/api/v1/{dispositivo['accessToken']}/telemetry"
        response = requests.post(url, json=telemetry_data, headers=headers, verify=False)
        response.raise_for_status()
        print(f"Datos de {dispositivo['id']} enviados correctamente")
    except requests.exceptions.RequestException as error:
        if hasattr(error, "response") and error.response:
            print("Error en la respuesta del sendTelemetryData:", error.response.json())
        else:
            print("Error al realizar la petición:", error)
        raise error

# Ejecutar las solicitudes para cada dispositivo y configurar un intervalo de 300 segundos (5 minutos)

while True:
    for dispositivo in devices:
        try:
            send_attributes(dispositivo)
            send_telemetry(dispositivo)
              # Esperar 5 minutos
        except Exception as error:
            print(f"Error al cargar los datos de {dispositivo['id']}:", error)

    time.sleep(300)