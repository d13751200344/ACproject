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
const bcrypt = require("bcrypt");
//引入並使用 bcrypt (hashing&salting passwords)
const saltRounds = 10;
//為hash function加密次數，若數字=X，則加密次數為2的X次方次。建議10或12次


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

//在使用者輸入資料送出 post req 進行 signup 時即要開始加密
app.post("/signup", (req, res, next) => {
	//console.log(req.body);  終端機將顯示使用者輸入的帳密
	let { username, password } = req.body;  //提取使用者所輸入的帳密
	/* 開始加密。先造鹽，參數1為加密次數(在上方const處)，參數二則是callback；
	callback中的參數1處理錯誤，參數二則是產生加密salt */
	bcrypt.genSalt(saltRounds, (err, salt) => {
		  //下方處理『加密發生問題』的錯誤。err對應參數
		if (err){
			next(err);
		}
		/* 下方所執行的是加鹽進行加密，參數1是對應上方所提取的req.body.password，
		參數2對應上方salt加鹽，參數3的callback則是要開始加密並將資料存入資料庫，
		參數hash即是將上方的salt加入密碼進行加密 */
		bcrypt.hash(password, salt, (err, hash) => {
			if (err){
				next(err);
			}
			//要在整個加密的環節(function)中進行使用者的資料儲存才能對資料進行加密
			let newUser = new User({ username: username, password: hash});
			//上方的password值對應的是加密過的hash而非req.body中的password
			try {
				newUser
					.save()
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
	});
});


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