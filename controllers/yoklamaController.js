const { Yoklama, Ders, User } = require('../models');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// @desc    Download an attendance record as a PDF
// @route   GET /api/yoklama/:id/pdf
// @access  Private
exports.downloadYoklamaPDF = async (req, res) => {
    try {
        const yoklama = await Yoklama.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'katilanOgrenciler',
                    attributes: ['id'],
                },
                {
                    model: Ders,
                    as: 'ders',
                    include: [{
                        model: User,
                        as: 'kayitliOgrenciler',
                        attributes: ['id', 'ad', 'soyad', 'okulNumarasi'],
                        through: { attributes: [] }
                    }]
                }
            ]
        });

        if (!yoklama) {
            return res.status(404).json({ msg: 'Yoklama kaydı bulunamadı' });
        }

        const { ders } = yoklama;
        const katilanIdSet = new Set(yoklama.katilanOgrenciler.map(o => o.id));
        const kayitliOgrenciler = ders.kayitliOgrenciler.sort((a, b) => (a.okulNumarasi || '').localeCompare(b.okulNumarasi));

        const fontName = 'DejaVuSans.ttf';
        const fontPath = path.join(__dirname, '..', 'assets', 'fonts', fontName);
        const fontUrl = 'https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf';

        if (!fs.existsSync(fontPath)) {
            try {
                const response = await axios.get(fontUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(fontPath, response.data);
            } catch (fontError) {
                console.error('Font could not be downloaded:', fontError);
                return res.status(500).send('Error preparing PDF: Font file is missing and could not be downloaded.');
            }
        }

        const doc = new PDFDocument({ margin: 50, bufferPages: true });

        const filename = `yoklama-${ders.dersAdi}-${new Date(yoklama.tarih).toLocaleDateString('tr-TR')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        doc.pipe(res);

        doc.registerFont('DejaVuSans', fontPath);
        doc.font('DejaVuSans');

        // Sayfa başlığı
        doc.fontSize(18).text(`${ders.dersAdi}`, { align: 'center' });
        doc.fontSize(12).text(`(${ders.sinif})`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Yoklama Tarihi: ${new Date(yoklama.tarih).toLocaleString('tr-TR')}`, { align: 'center' });
        doc.moveDown(2);

        const itemX = 50;
        const siraNoX = itemX;
        const statusX = siraNoX + 40; // Sıra No'dan sonra
        const numX = statusX + 50;    // Durumdan sonra
        const nameX = numX + 100;     // Okul Numarasından sonra

        const drawTableHeader = () => {
            doc.fontSize(10);
            doc.text('Sıra', siraNoX, doc.y);
            doc.text('Durum', statusX, doc.y);
            doc.text('Okul Numarası', numX, doc.y);
            doc.text('Öğrenci Adı Soyadı', nameX, doc.y);
            doc.moveDown();
            doc.moveTo(itemX, doc.y).lineTo(doc.page.width - itemX, doc.y).stroke();
            doc.moveDown(0.5);
        };

        drawTableHeader();
        
        doc.fontSize(12);
        const rowHeight = 20; // Her satır için yaklaşık yükseklik
        let siraNo = 1; // Sıra numarası sayacı

        kayitliOgrenciler.forEach(ogrenci => {
            // Sayfa sonuna gelip gelmediğini kontrol et
            if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                drawTableHeader();
            }
            
            const y = doc.y;
            const katildi = katilanIdSet.has(ogrenci.id);

            doc.text(siraNo.toString(), siraNoX, y, { width: 30, align: 'left' });
            doc.text(katildi ? '✓' : '✗', statusX, y, { width: 50, align: 'center' });
            doc.text(ogrenci.okulNumarasi || 'N/A', numX, y);
            doc.text(`${ogrenci.ad} ${ogrenci.soyad}`, nameX, y);
            doc.moveDown();
            siraNo++;
        });

        doc.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get attendance records for a course
// @route   GET /api/yoklama/kayitlar/:dersId
// @access  Private
exports.getAttendanceRecordsByCourse = async (req, res) => {
    try {
        const yoklamalar = await Yoklama.findAll({
            where: { dersId: req.params.dersId },
            order: [['tarih', 'DESC']]
        });
        res.json(yoklamalar);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get a single attendance record by ID with student details
// @route   GET /api/yoklama/:id
// @access  Private
exports.getAttendanceRecordDetails = async (req, res) => {
    try {
        const yoklama = await Yoklama.findByPk(req.params.id, {
            include: [{
                model: User,
                as: 'katilanOgrenciler',
                attributes: ['id', 'ad', 'soyad', 'okulNumarasi'],
                through: { attributes: [] } // Don't include association table attributes
            }]
        });

        if (!yoklama) {
            return res.status(404).json({ msg: 'Yoklama kaydı bulunamadı' });
        }

        res.json(yoklama);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

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


// @desc    Remove a student from an attendance record
// @route   DELETE /api/yoklama/:yoklamaId/ogrenciler/:ogrenciId
// @access  Private (for teachers)
exports.removeStudentFromAttendance = async (req, res) => {
    try {
        const { yoklamaId, ogrenciId } = req.params;

        const yoklama = await Yoklama.findByPk(yoklamaId);
        if (!yoklama) {
            return res.status(404).json({ msg: 'Yoklama kaydı bulunamadı' });
        }

        const ogrenci = await User.findByPk(ogrenciId);
        if (!ogrenci) {
            return res.status(404).json({ msg: 'Öğrenci bulunamadı' });
        }

        await yoklama.removeKatilanOgrenciler(ogrenci);

        res.json({ msg: 'Öğrenci yoklamadan kaldırıldı' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a student to an attendance record manually
// @route   POST /api/yoklama/:yoklamaId/ogrenciler
// @access  Private (for teachers)
exports.addStudentToAttendance = async (req, res) => {
    try {
        const { yoklamaId } = req.params;
        const { ogrenciId } = req.body;

        const yoklama = await Yoklama.findByPk(yoklamaId);
        if (!yoklama) {
            return res.status(404).json({ msg: 'Yoklama kaydı bulunamadı' });
        }

        const ogrenci = await User.findByPk(ogrenciId);
        if (!ogrenci) {
            return res.status(404).json({ msg: 'Öğrenci bulunamadı' });
        }

        // Add student to the attendance record
        await yoklama.addKatilanOgrenciler(ogrenci);

        // Return the newly added student's info
        res.status(201).json(ogrenci);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete an attendance record
// @route   DELETE /api/yoklama/:id
// @access  Private (for teachers)
exports.deleteAttendanceRecord = async (req, res) => {
    try {
        const yoklama = await Yoklama.findByPk(req.params.id);

        if (!yoklama) {
            return res.status(404).json({ msg: 'Yoklama kaydı bulunamadı' });
        }

        await yoklama.destroy();

        res.json({ msg: 'Yoklama kaydı başarıyla silindi' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};