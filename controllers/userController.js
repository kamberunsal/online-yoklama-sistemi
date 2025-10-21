const { User } = require('../models');

// @desc    Get all users, or filter by role
// @route   GET /api/users
// @access  Private (for Admins)
exports.getUsers = async (req, res) => {
    try {
        console.log("--- Fetching users from database ---");
        // Using the simplest possible query to ensure functionality
        const users = await User.findAll();
        
        console.log("--- Found users raw data ---", JSON.stringify(users, null, 2));

        // The user is reporting an empty list, so let's re-add the filter
        // and see if it works now after all the restarts.
        const { rol } = req.query;
        const whereClause = {};
        if (rol) {
            whereClause.rol = rol;
        }

        const filteredUsers = await User.findAll({
            where: whereClause,
            attributes: ['id', 'ad', 'soyad', 'email', 'rol', 'okulNumarasi'] // Exclude password
        });

        console.log(`--- Found ${filteredUsers.length} users after applying filter: ${rol || 'all'} ---`);

        res.json(filteredUsers);

    } catch (err) {
        console.error("--- Error fetching users: ---", err);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (for Admins)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Exclude password from being updated through this endpoint
        const { password, ...updateData } = req.body;

        await user.update(updateData);
        res.json(user);

    } catch (err) {
        console.error("--- Error updating user: ---", err);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (for Admins)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Using hooks: true to ensure associations like DersOgrenci are cleaned up
        await user.destroy({ hooks: true });

        res.json({ msg: 'User removed' });

    } catch (err) {
        console.error("--- Error deleting user: ---", err);
        res.status(500).send('Server Error');
    }
};