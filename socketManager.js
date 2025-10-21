const jwt = require('jsonwebtoken');
const { Yoklama, User } = require('./models');

const socketManager = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected with socket ID:', socket.id);

        socket.on('join-yoklama-room', (yoklamaId) => {
            socket.join(yoklamaId);
            console.log(`Socket ${socket.id} joined room ${yoklamaId}`);
        });

        socket.on('yoklamaya-katil', async (data) => {
            const { yoklamaId, kullaniciToken } = data;

            if (!yoklamaId || !kullaniciToken) {
                return socket.emit('error', 'Missing yoklamaId or user token.');
            }

            try {
                // 1. Verify token and get student
                const decoded = jwt.verify(kullaniciToken, process.env.JWT_SECRET || 'your_jwt_secret');
                const student = await User.findByPk(decoded.user.id);

                // 2. Find attendance session
                const yoklama = await Yoklama.findByPk(yoklamaId);

                if (!yoklama || !student) {
                    return socket.emit('error', 'Attendance session or student not found.');
                }

                if (yoklama.yoklamaDurumu !== 'aktif') {
                    return socket.emit('yoklama-sonlandi', 'This attendance session has ended.');
                }

                // 3. Add student to the attendance using the Sequelize association method
                const hasAttended = await yoklama.hasKatilanOgrenciler(student);
                if (hasAttended) {
                    return socket.emit('zaten-katildin', 'You are already marked as present.');
                }

                await yoklama.addKatilanOgrenciler(student);

                // 4. Prepare student info for the teacher
                const katilimciBilgisi = {
                    id: student.id,
                    ad: student.ad,
                    soyad: student.soyad,
                    okulNumarasi: student.okulNumarasi
                };

                // 5. Emit event to the specific room (teacher)
                io.to(yoklamaId).emit('yeni-katilimci', katilimciBilgisi);

                socket.emit('katilim-basarili', 'Successfully marked as present!');

            } catch (err) {
                console.error('Socket event `yoklamaya-katil` error:', err);
                if (err.name === 'JsonWebTokenError') {
                    return socket.emit('error', 'Invalid token.');
                }
                socket.emit('error', 'An error occurred during attendance.');
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketManager;