const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const recipedata = require("../schemas/recipe.js");
const userdata = require("../schemas/userdata.js");
const nodemailer = require("nodemailer");
const storageImg = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/images"); // Directory where the uploaded images will be stored
	},
	filename: (req, file, cb) => {
		const timestamp = Date.now(); // Get current timestamp
		const fileExtension = file.originalname.split(".").pop(); // Get file extension
		const uniqueFilename = `${timestamp}.${fileExtension}`; // Create unique filename
		cb(null, uniqueFilename); // Use the unique filename for the uploaded image
	},
});
const uploadImg = multer({ storage: storageImg });

router.post("/uploadimage", uploadImg.single("image"), (req, res) => {
	try {
		res.status(200).send({ filename: req.file.filename });
	} catch (err) {
		console.log(err.message);
	}
});

const videoStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/videos"); // Update with your desired video upload directory
	},
	filename: (req, file, cb) => {
		const timestamp = Date.now(); // Get current timestamp
		const fileExtension = file.originalname.split(".").pop(); // Get file extension
		const uniqueFilename = `${timestamp}.${fileExtension}`; // Create unique filename
		cb(null, uniqueFilename);
	},
});
const videoUpload = multer({ storage: videoStorage });

// Upload video route
router.post("/uploadvideo", videoUpload.single("video"), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ message: "No video file provided" });
	}
	// Update with your desired response
	res.json({ filename: req.file.filename });
});

router.post("/addrecipe", async (req, res) => {
	try {
		const { name, servings, duration, category, imageFile, videoFile, aboutRecipe, ingredients, preparation, email } = req.body;
		const userInfo = await userdata.findOne({ email });
		const recipeInfo = { name: name.toLowerCase(), servings, duration, category, imageFile, videoFile, aboutRecipe, ingredients, preparation, author: userInfo.username };

		const saverecipe = await recipedata.create(recipeInfo);
		userInfo.recipes.push(saverecipe._id);
		const updateUser = await userInfo.save();

		const followers = await userdata.find({ _id: { $in: userInfo.follwedBy } }, { email: 1 });
		const followerEmails = followers.map((follower) => follower.email);

		const transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.MAIL_ID,
				pass: process.env.MAIL_PASSWORD,
			},
		});

		followerEmails.forEach((followerEmail) => {
			transporter
				.sendMail({
					from: process.env.MAIL_ID,
					to: followerEmail,
					subject: "New Recipe Uploaded by " + userInfo.username,
					html: `<p>Hey there, ${userInfo.username} just uploaded a new recipe. Check it out now!</p></br> <a href=${process.env.FRONT_END_URL}/category/id=${saverecipe._id}>check it out</a>`,
				})
				.then(() => {
					console.log(`Email sent to ${followerEmail}`);
				})
				.catch((err) => {
					console.log(`Failed to send email to ${followerEmail}: ${err.message}`);
				});
		});

		res.status(200).send({ message: "recipe uploaded successfully", recipeId: saverecipe._id });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong" });
	}
});

router.post("/updaterecipe", async (req, res) => {
	try {
		const { name, servings, duration, catogory, imageFile, videoFile, aboutRecipe, ingredients, preparation, email } = req.body.formData;

		const recipe = await recipedata.findOne({ _id: req.body.id });

		recipe.name = name.toLowerCase();
		recipe.servings = servings;
		recipe.duration = duration;
		recipe.catogory = catogory;
		recipe.imageFile = imageFile;
		recipe.videoFile = videoFile;
		recipe.aboutRecipe = aboutRecipe;
		recipe.ingredients = ingredients;
		recipe.preparation = preparation;

		recipe.save();

		res.status(200).send({ message: "recipe uploaded successfully" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong" });
	}
});
router.post("/deleterecipe", async (req, res) => {
	try {
		const recipe = await recipedata.findOneAndDelete({ _id: req.body.id });
		const author = recipe.author;
		const user = await userdata.findOne({ username: author });
		const index = user.recipes.indexOf(recipe._id);
		if (index > -1) {
			user.recipes.splice(index, 1);
		}
		user.save();
		res.status(200).send({ message: "recipe deleted" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong" });
	}
});

router.post("/getallrecipenames", async (req, res) => {
	try {
		const recipes = await recipedata.find({}, { _id: 1, name: 1 });

		const recipeNames = recipes.reduce((acc, curr) => {
			const lowerCaseName = curr.name.toLowerCase();
			const index = acc.findIndex((obj) => obj.name === lowerCaseName);
			if (index === -1) {
				acc.push({ _id: curr._id, name: lowerCaseName });
			}
			return acc;
		}, []);
		const sortedRecipeNames = recipeNames.sort((a, b) => a.name.localeCompare(b.name));

		res.status(200).send({ recipeNames: sortedRecipeNames });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong" });
	}
});

router.post("/readrecipe", async (req, res) => {
	try {
		const { id } = req.body;
		const recipe = await recipedata.findOne({ _id: id });

		if (!recipe) res.status(200).send({ message: "recipe not found" });

		recipe.ingredients = recipe.ingredients.replace(/\n/g, "</br></br>");
		recipe.aboutRecipe = recipe.aboutRecipe.replace(/\n/g, "</br></br>");
		recipe.preparation = recipe.preparation.replace(/\n/g, "</br></br>");
		res.status(200).send(recipe);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});
router.post("/addcomment", async (req, res) => {
	try {
		const { id, email, comment } = req.body;
		const recipe = await recipedata.findOne({ _id: id });
		const user = await userdata.findOne({ email });
		recipe.comments.push({ userId: user._id, comment });
		await recipe.save();
		res.status(200).send("comment added");
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});
router.post("/getcomments", async (req, res) => {
	try {
		const { id } = req.body;
		const recipe = await recipedata.findOne({ _id: id });

		const dataToSend = [];
		for (const commentData of recipe.comments) {
			const user = await userdata.findOne({ _id: commentData.userId }, { username: 1, profileImage: 1 });
			dataToSend.push({
				username: user.username,
				profileImg: user.profileImage,
				comment: commentData.comment,
				commentId: commentData._id,
			});
		}
		dataToSend.reverse();
		res.status(200).send(dataToSend);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});

router.post("/deletecomment", async (req, res) => {
	try {
		const { recipeId, commentId } = req.body;
		const recipe = await recipedata.findOne({ _id: recipeId });

		const commentIndex = recipe.comments.findIndex((comment) => comment._id == commentId);

		if (commentIndex !== -1) {
			recipe.comments.splice(commentIndex, 1);
			const updatedRecipe = new recipedata(recipe);
			await updatedRecipe.save();
		}
		res.status(200).send({ message: "comment deleted" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});

router.post("/sameuser", async (req, res) => {
	try {
		const { recipeId, commentId } = req.body;
		const recipe = await recipedata.findOne({ _id: recipeId });
		const user = await userdata.findOne({ email: req.body.email }, { username: 1 });
		const commentIndex = recipe.comments.findIndex((comment) => comment._id == commentId);
		if (commentIndex == -1) return;
		if (recipe.comments[commentIndex].userId == user._id) {
			return res.status(200).send({ message: "sameUser" });
		}
		res.status(401).send({ message: "not a same user" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});

router.post("/getallrecipes", async (req, res) => {
	try {
		const { count } = req.body;
		console.log(count);
		const recipes = await recipedata
			.find()
			.skip(count * 10)
			.limit(10);

		res.status(200).send(recipes);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong" });
	}
});

module.exports = router;
