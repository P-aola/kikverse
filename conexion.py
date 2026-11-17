from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Pega aquí tu enlace de Atlas (cambia <usuario>, <password> y opcionalmente el nombre de la BD)
uri = "mongodb+srv://<usuario>:<password>@tu-cluster.mongodb.net/?retryWrites=true&w=majority"

# Crea el cliente y conecta al servidor
client = MongoClient(uri, server_api=ServerApi('1'))

# Selecciona la base de datos exacta que ya tenías creada
db = client["nombre_de_tu_base_de_datos"]

# Prueba que la conexión funcione
try:
    client.admin.command('ping')
    print("¡Conectado exitosamente a MongoDB Atlas!")
    print("Colecciones disponibles:", db.list_collection_names())
except Exception as e:
    print("Error al conectar:", e)