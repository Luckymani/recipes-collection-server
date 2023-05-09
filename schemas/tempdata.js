const mongoose = require("mongoose");

const tempSchema = new mongoose.Schema({
	email: String,
	password: String,
	username: String,
	otp: Number,
});
const tempdata = mongoose.model("tempdata", tempSchema);

module.exports = tempdata;
