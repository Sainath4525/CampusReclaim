const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const upload = require('../middleware/upload');
const { postLimiter } = require('../middleware/rateLimiter');

// GET all items (filters, search, sort, pagination)
router.get('/', itemController.getItems);

// GET a single item details
router.get('/:id', itemController.getItemById);

// POST a new lost/found item (rate limited, handles image upload)
router.post('/', postLimiter, upload.single('image'), itemController.createItem);

// PATCH update status of an item (rate limited)
router.patch('/:id/status', postLimiter, itemController.updateItemStatus);

// POST submit "I found this" contact notification (rate limited)
router.post('/:id/found', postLimiter, itemController.reportFoundItem);

// DELETE remove item report (verifies email or student ID)
router.delete('/:id', itemController.deleteItem);

module.exports = router;
