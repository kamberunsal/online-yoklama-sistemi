
const { User } = require('../models'); // Import from central index
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { ad, soyad, email, password, okulNumarasi, rol } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = await User.create({
            ad,
            soyad,
            email,
            password: hashedPassword,
            okulNumarasi: rol === 'ogrenci' ? okulNumarasi : null,
            rol
        });

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                rol: user.rol
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[Login] Attempting login for email: ${email}`);

    try {
        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            console.log(`[Login] User not found for email: ${email}`);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        console.log(`[Login] User found: ${user.id}`);

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[Login] Password mismatch for user: ${user.id}`);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        console.log(`[Login] Password matched for user: ${user.id}`);

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                rol: user.rol
            }
        };
        console.log(`[Login] Creating JWT payload for user: ${user.id}`);

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) {
                    console.error('[Login] JWT Sign Error:', err);
                    return res.status(500).send('Server error during token generation');
                }
                console.log(`[Login] JWT signed successfully. Sending response for user: ${user.id}`);
                res.json({
                    token,
                    user: { id: user.id, rol: user.rol, ad: user.ad, soyad: user.soyad }
                });
            }
        );

    } catch (err) {
        console.error('[Login] Critical error in login controller:', err);
        res.status(500).send('Server error');
    }
};
