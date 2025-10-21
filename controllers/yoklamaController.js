const { Yoklama, Ders, User } = require('../models');

// @desc    Start a new attendance session
// @route   POST /api/yoklama/baslat
// @access  Private (for teachers)
exports.startAttendance = async (req, res) => {
    const { dersId, ogretmenId } = req.body;

    try {
        // Validate inputs
        const ders = await Ders.findByPk(dersId);
        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const teacher = await User.findByPk(ogretmenId);
        if (!teacher || teacher.rol !== 'ogretmen') {
            return res.status(400).json({ msg: 'Invalid teacher ID or user is not a teacher.' });
        }

        // Check if the teacher is assigned to this course
        if (ders.ogretmenId != ogretmenId) {
            return res.status(403).json({ msg: 'Teacher is not authorized for this course' });
        }

        // Create and save new attendance session
        const newYoklama = await Yoklama.create({
            dersId,
            ogretmenId
        });

        // Return the unique ID for the QR code
        res.status(201).json({
            yoklamaId: newYoklama.id
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};