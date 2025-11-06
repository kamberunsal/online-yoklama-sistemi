
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

// Basic Route
app.get('/', (req, res) => {
    res.send('QR Code Attendance System API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth');
const dersRoutes = require('./routes/ders');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/dersler', dersRoutes);
app.use('/api/yoklama', require('./routes/yoklama'));
app.use('/api/users', require('./routes/users'));

// Veritabanı ve modelleri içeri aktar
const sequelize = require('./config/database');
const db = require('./models');

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection has been established successfully.');

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
