const mongoose = require('mongoose');

// Tu URI con tu contraseña real
const MONGO_URI = "mongodb+srv://cruzmadrigalpaolacbtis272_db_user:facil123@buffalo01.axmhp0e.mongodb.net/kickverse?retryWrites=true&w=majority";

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    desc: String,
    price: Number,
    image: String,
    tag: String,
    rating: Number
});

const Product = mongoose.model('Product', productSchema);

// Tus productos actuales
const initialProducts = [
    { id: 1, name: "Urban X Elite", category: "urban", desc: "Diseño futurista con amortiguación de aire y acabado en neón.", price: 1899, image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800", tag: "Popular", rating: 4.9 },
    { id: 2, name: "Cyber Runner 2077", category: "running", desc: "Malla transpirable con suela reactiva de alta tracción.", price: 2199, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800", tag: "Nuevo", rating: 5.0 },
    { id: 3, name: "Street Force High", category: "urban", desc: "Corte alto clásico reinventado con materiales reciclados.", price: 1699, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800", tag: "Oferta", rating: 4.7 },
    { id: 4, name: "Neon Velocity", category: "running", desc: "Ultra ligeros, diseñados para máxima velocidad en asfalto.", price: 1499, image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800", tag: "Oferta", rating: 4.8 },
    { id: 5, name: "Retro Wave '88", category: "classic", desc: "Estilo ochentero con tonos pasteles y piel sintética premium.", price: 1799, image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&q=80&w=800", tag: "Clásico", rating: 4.6 },
    { id: 6, name: "Phantom Stealth", category: "urban", desc: "Edición totalmente negra con detalles reflectantes nocturnos.", price: 2099, image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=800", tag: "Popular", rating: 4.9 }
];

async function seedDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a MongoDB Atlas...");
        
        await Product.deleteMany({}); // Limpia por si había pruebas
        await Product.insertMany(initialProducts);
        
        console.log("¡ÉXITO! 🎉 Todos los tenis han sido subidos a MongoDB Atlas.");
        process.exit();
    } catch (error) {
        console.error("Error al subir los datos:", error);
        process.exit(1);
    }
}

seedDB();
