require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const User = require("./models/user");
//引入 userSchema (在 models資料夾裡的 user.js內容)

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser(process.env.名稱));
app.use(session({
	secret: process.env.名稱,
	resave: false,
	saveUninitialized: true,
}));
app.use(flash());


mongoose.connect("mongodb://localhost:27017/test", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
})
.then(() => {
	console.log("Connected to MongoDB.");
})
.catch((err) => {
	console.log("Connection Failed.");
	console.log(err);
});


app.get("/", (req, res) => {
    res.render("index");
})

app.get("/", (req, res) => {
    res.send("Home page.");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", (req, res) => {
    //console.log(req.body);  終端機將顯示使用者輸入的帳密
    let { username, password } = req.body;
    res.send("Thanks for posting.");
});
//當使用者輸入帳密之後，按下送出＝在/signup中進行 post req，則系統將回以"Thanks for posting"

app.get("/*", (req, res) => {
	res.status(404).send("The page you're searching for doesn't exist.");
});


app.use((err, req, res, next) => {
	console.log(err);
	res.status(500).send("Error. Page is not found.");
});


app.listen(3000, () => {
    console.log("Server is running on port 3000.")
})