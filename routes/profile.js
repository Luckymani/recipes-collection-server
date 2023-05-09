const express = require("express");
const router = express.Router();
const userdata = require("../schemas/userdata.js");
const recipedata = require("../schemas/recipe.js");
const multer = require("multer");

router.post("/", async (req, res) => {
	try {
		const { username } = req.body;

		const userInfo = await userdata.findOne({ username }).populate("recipes");
		if (!userInfo) return res.status(404).send({ error: "page not found" });
		const dataToSend = {
			username: userInfo.username,
			followers: userInfo.follwedBy.length,
			following: userInfo.followingUsers.length,
			followingUsers: userInfo.followingUsers,
			follwedBy: userInfo.follwedBy,
			recipesCount: userInfo.recipes.length,
			recipes: userInfo.recipes,
			profileImage: userInfo.profileImage,
			description: userInfo.description,
			_id: userInfo._id,
		};
		res.status(200).send(dataToSend);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: " something wrong try again later" });
	}
});

router.post("/updateprofile", async (req, res) => {
	try {
		const { username, imageFile, description } = req.body;
		const existedData = await userdata.findOne({ email: req.body.email });

		if (username != existedData.username) {
			const userInfo = await userdata.findOne({ email: req.body.email }).populate("recipes");
			userInfo.recipes.map(async (singleRecipe) => {
				singleRecipe.author = username;
				await singleRecipe.save();
			});
			await userInfo.save();
		}

		existedData.profileImage = imageFile;
		existedData.username = username;
		existedData.description = description;
		await existedData.save();
		res.status(200).send({ message: "profile updated" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: " something wrong try again later" });
	}
});

//*-----------------------------multer---------------------//
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
//*--------------------------------------------uload image closed upto here----------------//

router.post("/getusername", async (req, res) => {
	try {
		const userInfo = await userdata.findOne({ email: req.body.email }, { username: 1, profileImage: 1 });
		res.status(200).send(userInfo);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try again later" });
	}
});

router.post("/checkforsameuser", async (req, res) => {
	try {
		const { username, email } = req.body;
		const reqForUser = await userdata.findOne({ username });
		const reqByUser = await userdata.findOne({ email });

		if (!reqForUser) return res.status(404).send({ error: "profile not found" });
		if (reqForUser.username === reqByUser.username) {
			res.status(200).send({ sameUser: true, following: false, currentUser: reqByUser.username });
		} else {
			const following = reqForUser.follwedBy.includes(reqByUser._id);
			if (following) res.status(200).send({ sameUser: false, following: true, currentUser: reqByUser.username });
			else res.status(200).send({ sameUser: false, following: false, currentUser: reqByUser.username });
		}
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: " something wrong try again later" });
	}
});

router.post("/unfollow", async (req, res) => {
	try {
		const reqByUser = await userdata.findOne({ email: req.body.email, password: req.body.password });
		const reqForUser = await userdata.findOne({ username: req.body.username });

		const index = reqForUser.follwedBy.indexOf(reqByUser._id);
		if (index > -1) {
			reqForUser.follwedBy.splice(index, 1);
		}
		await reqForUser.save();

		const index2 = reqByUser.followingUsers.indexOf(reqForUser._id);
		if (index2 > -1) {
			reqByUser.followingUsers.splice(index2, 1);
		}
		await reqByUser.save();

		return res.send({ message: "follower removed" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send("something went wrong");
	}
});

router.post("/follow", async (req, res) => {
	try {
		const reqByUser = await userdata.findOne({ email: req.body.email, password: req.body.password });
		const reqForUser = await userdata.findOne({ username: req.body.username });
		if (reqForUser._id === reqByUser._id) return;
		if (reqForUser.follwedBy.includes(reqByUser._id)) return;

		reqForUser.follwedBy.push(reqByUser._id);
		reqByUser.followingUsers.push(reqForUser._id);

		await reqForUser.save();
		await reqByUser.save();

		res.send({ message: "databasevupdated" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send("something went wrong");
	}
});

router.post("/removeFollower", async (req, res) => {
	try {
		const reqByUser = await userdata.findOne({ email: req.body.email, password: req.body.password });
		const reqForUser = await userdata.findOne({ username: req.body.username });

		const index = reqByUser.follwedBy.indexOf(reqForUser._id);
		if (index > -1) {
			reqByUser.follwedBy.splice(index, 1);
		}
		const index2 = reqForUser.followingUsers.indexOf(reqByUser._id);
		if (index2 > -1) {
			reqForUser.followingUsers.splice(index2, 1);
		}

		await reqForUser.save();
		await reqByUser.save();

		res.send({ message: "databasevupdated" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send("something went wrong");
	}
});

router.post("/like", async (req, res) => {
	try {
		const recipe = await recipedata.findOne({ _id: req.body.id });
		const likedBy = await userdata.findOne({ email: req.body.email, password: req.body.password });

		if (recipe.likedBy.includes(likedBy._id)) return;
		recipe.likes = recipe.likes + 1;

		recipe.likedBy.push(likedBy._id);

		await recipe.save();
		res.status(200).send({ message: "saved like" });
	} catch (err) {
		res.status(409).send({ error: "somethign went wrong" });
	}
});

router.post("/dislike", async (req, res) => {
	try {
		const recipe = await recipedata.findOne({ _id: req.body.id });
		const dislikedBy = await userdata.findOne({ email: req.body.email, password: req.body.password });

		recipe.likes = recipe.likes - 1;

		const index = recipe.likedBy.indexOf(dislikedBy._id);
		if (index > -1) {
			recipe.likedBy.splice(index, 1);
		}
		await recipe.save();
		res.status(200).send({ message: "disliked" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "somethign went wrong" });
	}
});
router.post("/addtowishlist", async (req, res) => {
	try {
		const userInfo = await userdata.findOne({ email: req.body.email });
		if (userInfo.wishList.includes(req.body.id)) return;
		userInfo.wishList.push(req.body.id);
		await userInfo.save();
		res.status(200).send("updated");
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "somethign went wrong" });
	}
});

router.post("/gatherinfo", async (req, res) => {
	try {
		const recipe = await recipedata.findOne({ _id: req.body.id });
		const userInfo = await userdata.findOne({ email: req.body.email, password: req.body.password });
		if (!recipe) return;
		if (!userInfo) return;
		const isLiked = recipe.likedBy.includes(userInfo._id);
		const isWishList = userInfo.wishList.includes(req.body.id);
		if (isLiked && isWishList) {
			return res.status(200).send({ isLiked: true, isWishList: true });
		} else if (!isLiked && isWishList) {
			return res.status(200).send({ isLiked: false, isWishList: true });
		} else if (isLiked && !isWishList) {
			return res.status(200).send({ isLiked: true, isWishList: false });
		} else {
			return res.status(200).send({ isLiked: false, isWishList: false });
		}
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "somethign went wrong" });
	}
});

router.post("/removefromwishlist", async (req, res) => {
	try {
		const userInfo = await userdata.findOne({ email: req.body.email });
		const index = userInfo.wishList.indexOf(req.body.id);
		if (index > -1) {
			userInfo.wishList.splice(index, 1);
		}
		await userInfo.save();
		res.send("updated");
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "somethign went wrong" });
	}
});

router.post("/getfollowers", async (req, res) => {
	try {
		const { username } = req.body;

		const userInfo = await userdata.findOne({ username });
		if (!userInfo) return res.status(404).send({ error: "page not found" });
		const followers = userInfo.follwedBy;
		const dataToSend = [];
		for (let i in followers) {
			const data = await userdata.findOne({ _id: followers[i] }, { username: 1, profileImage: 1 });
			dataToSend.push(data);
		}
		res.status(200).send(dataToSend);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: " something wrong try again later" });
	}
});
router.post("/getfollowing", async (req, res) => {
	try {
		const { username } = req.body;

		const userInfo = await userdata.findOne({ username });
		if (!userInfo) return res.status(404).send({ error: "page not found" });
		const following = userInfo.followingUsers;
		const dataToSend = [];
		for (let i in following) {
			const data = await userdata.findOne({ _id: following[i] }, { username: 1, profileImage: 1 });
			dataToSend.push(data);
		}
		res.status(200).send(dataToSend);
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: " something wrong try again later" });
	}
});
module.exports = router;
