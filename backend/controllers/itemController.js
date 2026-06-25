const Item = require('../models/Item');
const nodemailer = require('nodemailer');

// Helper to create nodemailer transporter
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ SMTP Credentials not configured in .env. Emails will be logged to console.');
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// GET /api/items - Fetch all items (with filters, search, sorting, pagination)
exports.getItems = async (req, res) => {
  try {
    const { search, category, location, dateFrom, dateTo, sortBy, page = 1, limit = 12 } = req.query;
    const query = {};

    // Live search (matches title or description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Location filter
    if (location && location !== 'All') {
      query.location = location;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.dateLost = {};
      if (dateFrom) {
        query.dateLost.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set dateTo to end of day
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.dateLost.$lte = endOfDay;
      }
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default newest
    if (sortBy === 'oldest') {
      sortOptions = { dateLost: 1 };
    } else if (sortBy === 'newest') {
      sortOptions = { dateLost: -1 };
    } else if (sortBy === 'views') {
      sortOptions = { views: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.status(200).json({
      success: true,
      items,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: 'Server error fetching items' });
  }
};

// GET /api/items/:id - Get single item and increment view count
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error fetching single item:', error);
    res.status(500).json({ success: false, message: 'Server error fetching item details' });
  }
};

// POST /api/items - Create a new lost/found item report
exports.createItem = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      location,
      dateLost,
      status,
      reporterName,
      reporterStudentId,
      reporterEmail,
      reporterPhone,
      reporterPreferContact
    } = req.body;

    // Validation
    if (!title || !category || !description || !location || !dateLost || !reporterName || !reporterEmail) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    let imageUrl = '';
    if (req.file) {
      // Store relative path so front-end can load it from backend url
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const newItem = new Item({
      title,
      category,
      description,
      imageUrl,
      location,
      dateLost: new Date(dateLost),
      status: status || 'lost',
      reportedBy: {
        name: reporterName,
        studentId: reporterStudentId || '',
        email: reporterEmail,
        phone: reporterPhone || '',
        preferContact: reporterPreferContact || 'email'
      }
    });

    await newItem.save();
    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, message: 'Server error creating item report' });
  }
};

// PATCH /api/items/:id/status - Update item status (lost/found/claimed)
exports.updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['lost', 'found', 'claimed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// POST /api/items/:id/found - Submit "I found this" message (sends email notification)
exports.reportFoundItem = async (req, res) => {
  try {
    const { finderName, finderEmail, finderPhone, finderMessage } = req.body;
    if (!finderName || !finderEmail || !finderMessage) {
      return res.status(400).json({ success: false, message: 'Please fill in finder details and message' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const reporter = item.reportedBy;
    const mailSubject = `CampusReclaim: Someone found your item "${item.title}"!`;
    const mailText = `
Hello ${reporter.name},

Good news! Someone has reported finding your lost item: "${item.title}".

Finder's Name: ${finderName}
Finder's Email: ${finderEmail}
Finder's Phone: ${finderPhone || 'Not provided'}

Message from finder:
"${finderMessage}"

You can coordinate with them to reclaim your item. Once you have successfully recovered your item, please make sure to mark it as "Claimed" on the website!

Best regards,
CampusReclaim Team
    `;

    const transporter = getTransporter();
    if (transporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"CampusReclaim" <no-reply@campusreclaim.edu>',
        to: reporter.email,
        subject: mailSubject,
        text: mailText
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${reporter.email}`);
    } else {
      // Log notification text since SMTP credentials aren't set
      console.log('--- EMAIL NOTIFICATION LOG ---');
      console.log(`To: ${reporter.email}`);
      console.log(`Subject: ${mailSubject}`);
      console.log(`Body: ${mailText}`);
      console.log('------------------------------');
    }

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully to the original reporter!'
    });
  } catch (error) {
    console.error('Error reporting found item:', error);
    res.status(500).json({ success: false, message: 'Server error sending report' });
  }
};

// DELETE /api/items/:id - Remove item report (with simple auth check)
exports.deleteItem = async (req, res) => {
  try {
    const { studentId, email } = req.body;
    if (!studentId && !email) {
      return res.status(400).json({ success: false, message: 'Student ID or email is required to verify ownership' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Verify ownership: must match either reporter's studentId or email
    const matchStudentId = studentId && item.reportedBy.studentId === studentId;
    const matchEmail = email && item.reportedBy.email.toLowerCase() === email.toLowerCase();

    if (!matchStudentId && !matchEmail) {
      return res.status(403).json({ success: false, message: 'Authorization failed. Credentials do not match the reporter details.' });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Item successfully deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Server error deleting item' });
  }
};
