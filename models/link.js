var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('Link', new Schema({
    url: String,
    title: String,
    username: String
}));