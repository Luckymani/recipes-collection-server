const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const recipedata = require("../schemas/recipe.js");
const userdata = require("../schemas/userdata.js");

router.post("/", (req, res) => {
	try {
		const authToken = req.body.authToken;
		const verifyJwt = jwt.decode(authToken, process.env.JWT_SECRET_KEY);

		if (!verifyJwt) return res.status(401).send({ error: "token expired login again" });

		res.status(200).cookie("authToken", authToken, { secure: true, httpOnly: true, sameSite:'none' }).send({ message: "token verified" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "server error try agian some time" });
	}
});

router.post("/recomended", async (req, res) => {
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
			if (count <= 5) {
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

router.post("/within15min", async (req, res) => {
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
			if (count <= 5) {
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
module.exports = router;
