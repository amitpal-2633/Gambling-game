const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    number: { type: Number, default: null }
});

module.exports = mongoose.model('Admin', adminSchema);
