
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// ==========================================
// 1. CONEXIÓN A MONGODB ATLAS
// ==========================================

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'test';

async function connectDB() {
    try {
        if (!MONGO_URI) {
            throw new Error('No se encontró MONGO_URI en el archivo .env');
        }

        await mongoose.connect(MONGO_URI, {
            dbName: DB_NAME
        });

        console.log('✅ Conectado a MongoDB Atlas');
        console.log('📂 Base de datos:', mongoose.connection.name);
        console.log('📦 Colección de productos: productos');
        console.log('📦 Colección de reservaciones: reservaciones');

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    }
}

// ==========================================
// 2. MODELO DE PRODUCTOS
// ==========================================

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    category: String,
    desc: String,
    price: Number,
    image: String,
    tag: String,
    rating: Number,

    sizes: [{
        size: Number,
        stock: {
            type: Number,
            default: 0
        },
        sold: {
            type: Number,
            default: 0
        }
    }],

    reservationVersion: {
        type: Number,
        default: 0
    }

}, { collection: 'productos' });

const Product = mongoose.model('Product', productSchema);

// ==========================================
// 3. MODELO DE RESERVACIONES
// ==========================================

const reservationSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },

    size: {
        type: Number,
        required: true
    },

    token: {
        type: String,
        required: true,
        unique: true
    },

    status: {
        type: String,
        enum: ['active', 'confirmed', 'expired'],
        default: 'active'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: {
        type: Date,
        required: true
    }

}, { collection: 'reservaciones' });

const Reservation = mongoose.model('Reservation', reservationSchema);

// ==========================================
// 4. OBTENER PRODUCTOS
// ==========================================

app.get('/api/products', async (req, res) => {
    try {
        const now = new Date();

        const products = await Product.find().lean();

        const activeReservations = await Reservation.aggregate([
            {
                $match: {
                    status: 'active',
                    expiresAt: { $gt: now }
                }
            },
            {
                $group: {
                    _id: {
                        productId: '$productId',
                        size: '$size'
                    },
                    reserved: { $sum: 1 }
                }
            }
        ]);

        const reservationMap = {};

        activeReservations.forEach(item => {
            const key = `${item._id.productId}_${item._id.size}`;
            reservationMap[key] = item.reserved;
        });

        const result = products.map(product => {
            product.sizes = (product.sizes || []).map(item => {
                const key = `${product._id}_${item.size}`;

                const reserved = reservationMap[key] || 0;

                const available = Math.max(
                    item.stock - item.sold - reserved,
                    0
                );

                return {
                    ...item,
                    reserved,
                    available
                };
            });

            return product;
        });

        res.json(result);

    } catch (error) {
        console.error('Error al consultar productos:', error);

        res.status(500).json({
            error: 'Error al consultar productos'
        });
    }
});

// ==========================================
// 5. AGREGAR PRODUCTOS DESDE ADMIN
// ==========================================

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);

        await newProduct.save();

        console.log('✅ Producto guardado:', newProduct.name);

        res.status(201).json(newProduct);

    } catch (error) {
        console.error('Error al guardar producto:', error);

        res.status(500).json({
            error: 'Error al guardar el producto'
        });
    }
});

// ==========================================
// 6. APARTAR UN TENIS DURANTE 5 MINUTOS
// ==========================================

app.post('/api/reservations', async (req, res) => {
    const { productId, size } = req.body;

    if (
        !mongoose.isValidObjectId(productId) ||
        !Number.isFinite(Number(size))
    ) {
        return res.status(400).json({
            error: 'Debes proporcionar un producto y una talla válidos.'
        });
    }

    const selectedSize = Number(size);
    const token = crypto.randomUUID();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    const session = await mongoose.startSession();

    try {
        let reservationResult = null;

        await session.withTransaction(async () => {

            const product = await Product.findById(productId)
                .session(session);

            if (!product) {
                throw new Error('PRODUCT_NOT_FOUND');
            }

            const sizeInfo = product.sizes.find(
                item => item.size === selectedSize
            );

            if (!sizeInfo) {
                throw new Error('SIZE_NOT_FOUND');
            }

            const reserved = await Reservation.countDocuments({
                productId,
                size: selectedSize,
                status: 'active',
                expiresAt: { $gt: now }
            }).session(session);

            const available =
                sizeInfo.stock - sizeInfo.sold - reserved;

            if (available <= 0) {
                throw new Error('OUT_OF_STOCK');
            }

            await Product.updateOne(
                { _id: productId },
                { $inc: { reservationVersion: 1 } },
                { session }
            );

            await Reservation.create([{
                productId,
                size: selectedSize,
                token,
                status: 'active',
                createdAt: now,
                expiresAt
            }], { session });

            reservationResult = {
                token,
                productId,
                size: selectedSize,
                expiresAt
            };
        });

        res.status(201).json({
            message: 'Tenis apartado correctamente durante 5 minutos.',
            reservation: reservationResult
        });

    } catch (error) {
        console.error('Error al apartar:', error);

        if (error.message === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({
                error: 'El producto no existe.'
            });
        }

        if (error.message === 'SIZE_NOT_FOUND') {
            return res.status(404).json({
                error: 'La talla seleccionada no está registrada.'
            });
        }

        if (error.message === 'OUT_OF_STOCK') {
            return res.status(409).json({
                error: 'Esta talla ya no está disponible.'
            });
        }

        res.status(500).json({
            error: 'No se pudo realizar el apartado.'
        });

    } finally {
        await session.endSession();
    }
});

// ==========================================
// 7. CONFIRMAR LA COMPRA
// ==========================================

app.post('/api/reservations/:token/confirm', async (req, res) => {

    const { token } = req.params;
    const session = await mongoose.startSession();

    try {
        let result = null;

        await session.withTransaction(async () => {

            const now = new Date();

            const reservation = await Reservation.findOne({
                token,
                status: 'active'
            }).session(session);

            if (!reservation) {
                result = {
                    success: false,
                    message: 'El apartado no existe o ya fue utilizado.'
                };
                return;
            }

            if (reservation.expiresAt <= now) {
                await Reservation.updateOne(
                    { _id: reservation._id, status: 'active' },
                    { $set: { status: 'expired' } },
                    { session }
                );

                result = {
                    success: false,
                    message: 'El tiempo del apartado terminó. El tenis volvió a estar disponible.'
                };

                return;
            }

            const productUpdate = await Product.updateOne(
                { _id: reservation.productId },
                {
                    $inc: {
                        'sizes.$[selected].sold': 1,
                        reservationVersion: 1
                    }
                },
                {
                    arrayFilters: [
                        { 'selected.size': reservation.size }
                    ],
                    session
                }
            );

            if (
                productUpdate.matchedCount !== 1 ||
                productUpdate.modifiedCount !== 1
            ) {
                throw new Error('PRODUCT_UPDATE_FAILED');
            }

            await Reservation.updateOne(
                {
                    _id: reservation._id,
                    status: 'active'
                },
                {
                    $set: { status: 'confirmed' }
                },
                { session }
            );

            result = {
                success: true,
                message: 'Compra confirmada. El par quedó registrado como vendido.'
            };
        });

        if (!result.success) {
            return res.status(409).json(result);
        }

        res.json(result);

    } catch (error) {
        console.error('Error al confirmar compra:', error);

        res.status(500).json({
            error: 'No se pudo confirmar la compra.'
        });

    } finally {
        await session.endSession();
    }
});

// ==========================================
// 8. LIBERAR APARTADOS VENCIDOS
// ==========================================

async function releaseExpiredReservations() {
    try {
        const result = await Reservation.updateMany(
            {
                status: 'active',
                expiresAt: { $lte: new Date() }
            },
            {
                $set: { status: 'expired' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(
                `⏰ ${result.modifiedCount} apartado(s) liberado(s).`
            );
        }

    } catch (error) {
        console.error('Error al liberar apartados:', error);
    }
}

setInterval(releaseExpiredReservations, 15000);

// ==========================================
// 9. INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}

startServer();
