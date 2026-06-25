const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  location: { type: String, required: true },
  dateLost: { type: Date, required: true },
  status: { type: String, enum: ['lost', 'found', 'claimed'], default: 'lost' },
  reportedBy: {
    name: { type: String, required: true },
    studentId: { type: String, default: '' },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    preferContact: { type: String, enum: ['email', 'phone', 'either'], default: 'email' }
  },
  views: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);
