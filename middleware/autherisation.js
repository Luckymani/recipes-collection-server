const jwt = require("jsonwebtoken");
require("dotenv").config();

async function autherisation(req, res, next) {
	try {
		console.log("......................."+req.cookies.authToken+"...................................")
		const verifyJwt = await jwt.decode(req.cookies.authToken, process.env.JWT_SECRET_KEY);

		if (verifyJwt) {
			req.body = { ...req.body, email: verifyJwt.username, password: verifyJwt.password };
			next();
		} else {
			console.log("verifyjwt failed in autherisation");
			res.status(401).send("authentication failed login again");
		}
	} catch (err) {
		console.log(err.message);
		res.status(501).send("something went wrong");
	}
}
module.exports = autherisation;
