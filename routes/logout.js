const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
	try {
		res.clearCookie("authToken");
		res.status(200);
		res.send("logouted succesfully");
	} catch (err) {
		res.status(501);
	}
});
module.exports = router;
