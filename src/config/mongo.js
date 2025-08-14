// src/config/mongo.js
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI
  || 'mongodb+srv://DaianaSosa:Pollito838@cluster0.kgaosi6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ Conectado a MongoDB ${MONGO_URI.startsWith('mongodb+srv://') ? 'Atlas' : 'Local'}`);
    console.log(`   Host: ${conn.connection.host}  DB: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error al conectar MongoDB Atlas', error);
    process.exit(1);
  }
};
