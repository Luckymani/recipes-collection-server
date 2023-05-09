const express = require("express");
const router = express.Router();
const userdata = require("../schemas/userdata.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

router.post("/", async (req, res) => {
	try {
		const { username, password } = req.body;
		const userExist = await userdata.findOne({ email: username, password });
		if (!userExist) return res.status(401).send({ error: "invalid credentials" });
		const jwtToken = jwt.sign(req.body, process.env.JWT_SECRET_KEY, { expiresIn: "24d" });
		res.status(200).cookie("authToken", jwtToken,{ secure: true, httpOnly: true, sameSite:'none' }).send({ jwtToken, message: "login succesfull" });

	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "server error try again" });
	}
});

router.post("/forgotpassword", async (req, res) => {
	try {
		const { email } = req.body;
		const userExist = await userdata.findOne({ email });
		if (!userExist) return res.status(401).send({ error: "mail not exist check your mail" });

		const otp = Math.floor(Math.random() * 9000) + 1000;
		userExist.otp = otp;
		const updatedUser = await userExist.save();

		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.MAIL_ID, // generated ethereal user
				pass: process.env.MAIL_PASSWORD, // generated ethereal password
			},
		});
		let info = transporter.sendMail({
			from: process.env.MAIL_ID, // sender address
			to: email, // list of receivers
			subject: "recipes collection", // Subject line
			text: `use this otp to chang your password`, // plain text body
			html: `<h3>otp to change the password</h3></br>
					<h2>${otp}</h2>`,
		});
		res.status(200).send({ message: "otp has been sent to your mail" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "something went wrong try agian later" });
	}
});

router.post("/otpverification", async (req, res) => {
	try {
		const { email, otp } = req.body;

		const findUser = await userdata.findOne({ email, otp });

		if (!findUser) return res.status(401).send({ error: "incorrect otp" });

		res.status(200).send({ message: "set your new password" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "sometthing went wrong try again" });
	}
});
router.post("/passwordChange", async (req, res) => {
	try {
		const { email, newPassword } = req.body;
		const findUser = await userdata.findOne({ email });

		findUser.password = newPassword;
		const updatedUser = await findUser.save();

		res.status(200).send({ message: "password Changed" });
	} catch (err) {
		console.log(err.message);
		res.status(409).send({ error: "sometthing went wrong try again" });
	}
});

module.exports = router;
