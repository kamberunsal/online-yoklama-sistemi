
const express = require('express');

const cors = require('cors');
require('dotenv').config({ path: './config/.env' });

const app = express();

// Middleware
const corsOptions = {
    origin: 'https://yoklama-frontend.onrender.com',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection has been established successfully.');

        // { alter: true } seçeneği production'da yavaşlamalara ve timeout'lara neden olabilir.
        // Sadece eksik tabloları oluşturmak daha güvenlidir.
        await db.sequelize.sync();
        console.log('All models were synchronized successfully.');

        const PORT = process.env.PORT || 5000;

        // Socket.IO Integration
        const http = require('http');
        const server = http.createServer(app);
        const { Server } = require("socket.io");
        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Handle Socket.IO connections
        const socketManager = require('./socketManager');
        socketManager(io);

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1); // Başlangıçta hata olursa uygulamayı sonlandır
    }
};

startServer();
