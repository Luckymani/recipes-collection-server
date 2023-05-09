const express = require("express");
const router = express.Router();
const recipedata = require("../schemas/recipe.js");
const userdata = require("../schemas/userdata.js");

router.post("/", async (req, res) => {
	console.log(req.body);
	try {
		const { type, value } = req.body;
		if (type == "catogory") {
			const recipes = await recipedata.find({ catogory: value });
			res.status(200).send(recipes);
		} else if (type == "name") {
			const recipes = await recipedata.find({ name: value });
			res.status(200).send(recipes);
		}
	} catch (err) {
		console.log(err.message);
	}
});

router.post("/getallrecomended", async (req, res) => {
	try {
		const recipes = await recipedata.find({}, { likes: 1 });

		recipes.sort(function (a, b) {
			return b.likes - a.likes;
		});
		const dataTosend = [];
		const dataToFind = [];
		let count = 0;
		for (let i of recipes) {
			count = count + 1;
			if (count <= 20) {
				dataToFind.push(i.id);
			} else {
				break;
			}
		}

		for (let value of dataToFind) {
			const item = await recipedata.findOne({ _id: value });
			dataTosend.push(item);
		}

		res.send(dataTosend);
	} catch (err) {
		console.log(err.message);
	}
});

router.post("/getallwithin15min", async (req, res) => {
	try {
		const recipes = await recipedata.find({}, { duration: 1 });

		const TempArray = [];
		recipes.map((data, index) => {
			if (data.duration < 15) {
				TempArray.push(data);
			}
		});
		const dataTosend = [];
		const dataToFind = [];
		let count = 0;
		for (let i of TempArray) {
			count = count + 1;
			if (count <= 20) {
				dataToFind.push(i.id);
			} else {
				break;
			}
		}

		for (let value of dataToFind) {
			const item = await recipedata.findOne({ _id: value });
			dataTosend.push(item);
		}

		res.send(dataTosend);
	} catch (err) {
		console.log(err.message);
	}
});

router.post("/wishlist", async (req, res) => {
	try {
		const { email, password } = req.body;
		const userInfo = await userdata.findOne({ email }, { wishList: 1 }).populate("wishList");
		res.status(200).send(userInfo.wishList);
	} catch (err) {
		console.log(err.message);
	}
});

module.exports = router;
