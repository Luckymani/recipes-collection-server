const mongoose = require("mongoose");
const recipeSchema = new mongoose.Schema({
	name: String,
	catogory: String,
	aboutRecipe: String,
	duration: Number,
	servings: Number,
	ingredients: String,
	preparation: String,
	imageFile: String,
	videoFile: String,
	author: String,
	comments: [
		{
			userId: String,
			comment: String,
		},
	],
	createdAt: {
		type: Date,
		immutable: true,
		default: () => new Date(),
	},
	updatedAt: {
		type: Date,
		default: () => new Date(),
	},
	likes: {
		type: Number,
		default: 0,
	},
	likedBy: [String],
	views: {
		type: Number,
		default: 0,
	},
});

const recipedata = mongoose.model("recipe", recipeSchema);

module.exports = recipedata;
