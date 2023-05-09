const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const tempdata = require("../schemas/tempdata.js");
const userdata = require("../schemas/userdata.js");
require("dotenv").config();

router.post("/", async (req, res) => {
	try {
		const { username, email } = req.body;
		const userByName = await userdata.findOne({ username });
		if (userByName) return res.status(409).json({ error: "Username already exists" });

		const userByEmail = await userdata.findOne({ email });
		if (userByEmail) return res.status(409).json({ error: "email already exists" });

		const dataToUpload = { ...req.body, otp: Math.floor(Math.random() * 9000) + 1000 };
		const uploadData = await tempdata.create(dataToUpload);
		let transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				user: process.env.MAIL_ID, // generated ethereal user
				pass: process.env.MAIL_PASSWORD, // generated ethereal password
			},
		});

		//?send otp through nodemailer
		let info = transporter.sendMail({
			from: process.env.MAIL_ID, // sender address
			to: email, // list of receivers
			subject: "recipes collection account activation", // Subject line
			text: "activate your account to use our service", // plain text body
			html: `<body>
			<h1>Activate Your Account</h1>
			<p>Thank you for registering with our service. To activate your account, please click the link below:</p>
			<a href="${process.env.FRONT_END_URL}/accountactivation/?username=${username}&code=${uploadData.otp}">Activate Now</a>
			<p>If the above link does not work, you can also copy and paste the following URL into your web browser:</p>
			<p>${process.env.FRONT_END_URL}/accountactivation/?username=${username}&code=${uploadData.otp}</p>
		  </body>`,
		});
		res.status(200).send("activation link sent to your mail");
	} catch (err) {
		console.log(err.message);
		res.status(400).json({ error: "something went wrong" });
	}
});

router.post("/accountactivation", async (req, res) => {
	try {
		const { username, code } = req.body;
		const checkUser = await userdata.findOne({ username });
		if (checkUser) return res.status(200).send("already activated got to login");

		const receivedFrom = await tempdata.findOne({ username });
		if (!receivedFrom) return res.status(401).send({ error: " invalid link! check for latest mail" });
		if (code != receivedFrom.otp) return res.status(401).send({ error: "invalid link! check for latest mail" });
		const addUserData = await userdata.create({ username, email: receivedFrom.email, password: receivedFrom.password });
		res.status(200).send("activation succesfull");
	} catch (err) {
		console.log(err.message);
		res.status(400).send({ error: "server error" });
	}
});

module.exports = router;
