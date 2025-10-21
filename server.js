
const express = require('express');

const cors = require('cors');
require('dotenv').config({ path: './config/.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection with Sequelize
const sequelize = require('./config/database');
const db = require('./models'); // Import models to sync

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connection has been established successfully.');
        // Sync all models
        await db.sequelize.sync({ alter: true }); // { force: true } to drop and re-create
        console.log('All models were synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};
connectDB();

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


const PORT = process.env.PORT || 5000;

// Socket.IO Integration
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity. For production, restrict this.
        methods: ["GET", "POST"]
    }
});

// Handle Socket.IO connections
const socketManager = require('./socketManager');
socketManager(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
