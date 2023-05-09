//*imports
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
//*require middleware
const autherisation = require("./middleware/autherisation.js");
//*initianlisations
const app = express();
require("dotenv").config();

//? mongoose database
const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
};
mongoose
	.connect(process.env.MONGODB_URL, options)
	.then(() => {
		console.log("connection to the database succesfull");
	})
	.catch((err) => {
		console.log(err.message);
	});

//*middleware
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true, parameterLimit: 50000 }));
app.use(express.static("uploads"));
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
app.use(cors({ credentials: true, origin: "https://recipes-collection-web.netlify.app" }));
app.use(cookieParser({
	secure: true,
	sameSite: 'none'
  }));

//*routes
app.use("/register", require("./routes/register.js"));
app.use("/login", require("./routes/login.js"));
app.use("/main", require("./routes/main.js"));
app.use("/recipe", autherisation, require("./routes/recipe.js"));
app.use("/profile", autherisation, require("./routes/profile.js"));
app.use("/catogory", autherisation, require("./routes/catogory.js"));
app.use("/logout", require("./routes/logout.js"));

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`));
