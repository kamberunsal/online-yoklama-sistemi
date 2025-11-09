const { User } = require('../models');
const bcrypt = require('bcryptjs');

const hashPasswords = async () => {
    console.log('Starting password hashing process...');
    try {
        const users = await User.findAll();
        let updatedCount = 0;

        for (const user of users) {
            // Check if the password is likely plain text (i.e., not a bcrypt hash)
            // Bcrypt hashes start with $2a$, $2b$, or $2y$.
            if (user.password && !user.password.startsWith('$2')) {
                console.log(`Found plain text password for user ID: ${user.id}. Hashing...`);
                
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                
                user.password = hashedPassword;
                await user.save();
                
                console.log(`Successfully hashed and updated password for user ID: ${user.id}`);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`Process finished. Total passwords updated: ${updatedCount}`);
        } else {
            console.log('Process finished. No plain text passwords found to update.');
        }

    } catch (error) {
        console.error('An error occurred during the password hashing process:', error);
    } finally {
        // Close the database connection if the script is run standalone
        const { sequelize } = require('../models');
        await sequelize.close();
        console.log('Database connection closed.');
    }
};

// Run the function
hashPasswords();
