const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	email: String,
	otp: Number,
	profileImage: String,
	description: {
		type: String,
		default: "let people know about your recipes with some description",
	},
	followingUsers: [String],
	follwedBy: [String],
	recipes: [{ type: mongoose.SchemaTypes.ObjectId, ref: "recipe" }],
	wishList: [{ type: mongoose.SchemaTypes.ObjectId, ref: "recipe" }],
});

const userdata = mongoose.model("user", userSchema);

module.exports = userdata;
