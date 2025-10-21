const { Ders, User } = require('../models');

// @desc    Create a new course
// @route   POST /api/dersler
// @access  Private (for teachers)
exports.createDers = async (req, res) => {
    const { dersAdi, ogretmenId, sinif, gun, baslangicSaati, bitisSaati } = req.body;

    try {
        // Simple validation: Check if the teacher exists and has the role 'ogretmen'
        const teacher = await User.findByPk(ogretmenId);
        if (!teacher || teacher.rol !== 'ogretmen') {
            return res.status(400).json({ msg: 'Invalid teacher ID or user is not a teacher.' });
        }

        const newDers = await Ders.create({
            dersAdi,
            ogretmenId,
            sinif,
            gun,
            baslangicSaati,
            bitisSaati
        });

        res.status(201).json(newDers);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get courses for a specific user (student or teacher)
// @route   GET /api/dersler/:userId
// @access  Private
exports.getDerslerByUserId = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        let dersler;
        if (user.rol === 'ogretmen') {
            // Find courses taught by the teacher
            dersler = await Ders.findAll({ 
                where: { ogretmenId: req.params.userId },
                order: [['gun', 'ASC'], ['baslangicSaati', 'ASC']]
            });
        } else if (user.rol === 'ogrenci') {
            // Use the many-to-many association to get the student's courses
            dersler = await user.getAldigiDersler();
        } else {
            dersler = [];
        }

        res.json(dersler);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a course
// @route   DELETE /api/dersler/:dersId
// @access  Private (for teachers)
exports.deleteDers = async (req, res) => {
    const { id } = req.params; // Corrected from dersId to id

    try {
        const ders = await Ders.findByPk(id); // Use the correct variable
        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        await ders.destroy();

        res.json({ msg: 'Course removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a student to a course
// @route   POST /api/dersler/:dersId/ogrenciler
// @access  Private (for Admins)
exports.addStudentToDers = async (req, res) => {
    const { dersId } = req.params;
    const { ogrenciId } = req.body;

    try {
        const ders = await Ders.findByPk(dersId);
        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const student = await User.findByPk(ogrenciId);
        if (!student || student.rol !== 'ogrenci') {
            return res.status(404).json({ msg: 'Student not found' });
        }

        await ders.addKayitliOgrenciler(student);

        res.json({ msg: 'Student added to the course' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Remove a student from a course
// @route   DELETE /api/dersler/:dersId/ogrenciler/:ogrenciId
// @access  Private (for Admins)
exports.removeStudentFromDers = async (req, res) => {
    const { dersId, ogrenciId } = req.params;

    try {
        const ders = await Ders.findByPk(dersId);
        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        const student = await User.findByPk(ogrenciId);
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        await ders.removeKayitliOgrenciler(student);

        res.json({ msg: 'Student removed from the course' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all courses (for admin)
// @route   GET /api/dersler/all
// @access  Private (for Admins)
exports.getAllDersler = async (req, res) => {
    try {
        const dersler = await Ders.findAll({
            include: [{
                model: User,
                as: 'ogretmen',
                attributes: ['ad', 'soyad']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(dersler);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get a single course by ID with details (for admin)
// @route   GET /api/dersler/detay/:id
// @access  Private (for Admins)
exports.getDersById = async (req, res) => {
    try {
        const ders = await Ders.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'ogretmen',
                    attributes: ['ad', 'soyad']
                },
                {
                    model: User,
                    as: 'kayitliOgrenciler',
                    attributes: ['id', 'ad', 'soyad', 'okulNumarasi'],
                    through: { attributes: [] } // Don't include the junction table data
                }
            ]
        });

        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        res.json(ders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a course
// @route   PUT /api/dersler/:id
// @access  Private (for Admins)
exports.updateDers = async (req, res) => {
    try {
        const ders = await Ders.findByPk(req.params.id);

        if (!ders) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // In a real app, you'd also validate req.body contents
        const updatedDers = await ders.update(req.body);

        res.json(updatedDers);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};