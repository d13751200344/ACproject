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
app.use(cookieParser(process.env.SECRET));
app.use(session({
	secret: process.env.SECRET,
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
    res.send("Home page.");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", (req, res, next) => {
    //console.log(req.body);  終端機將顯示使用者輸入的帳密
    let { username, password } = req.body;
	/* 下方接著創建newUser，assign它為新的User(引入的Schema)，其資料中的username與password等於上方從req.body所提取之值 */
	let newUser = new User({ username: username, password: password});
	try {
		newUser.save()
			.then(()=>{
				res.send("Data has been saved.")
			})
			.catch((e)=>{
				console.log(e);
				res.send("Failed to save data.")
			});
	} catch(err) {
		next(err);
	}
});
//當使用者輸入帳密之後，按下送出＝在/signup中進行 post req，則系統將回以"Thanks for posting"

app.get("/login", (req, res) => {
	res.render("login");
});
app.post("/login", async (req, res, next) => {
	let {username, password} = req.body;  //提取使用者輸入的帳密
	try {
		//接著在User model中尋找吻合的資料
		let foundUser = await User.findOne({username: username});
		//接著用if statement確認資料。
		//補充: if(!foundUser) 代表找不到foundUser
		//如果有找到foundUser且密碼沒錯則看到secret；找不到foundUser或密碼不對則進else
		if (foundUser && password == foundUser.password) {
			res.render("secret");
		} else {
			res.send("Incorrect username or password.")
		}
	} catch (err) {
		next(err);
	}
});

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