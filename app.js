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
//下方用自訂 middleware & req.session.isVerified 達成需要登入才能看 & stay logged
//也可以使用自訂 middleware 搭配指定 route
const requireLogin = (req, res, next) => {
	if(!req.session.isVerified == true) {
		res.redirect("login");
	}
	next();
};

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

//利用自訂 middleware 搭配 req.session.isVerified 指定某個網頁需要登入才能看
//也可以使用自訂 middleware 搭配指定 route
app.get("/secret", requireLogin, (req, res) => {
	res.render("secret");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

//在使用者輸入資料送出 post req 進行 signup 時即要開始加密
app.post("/signup", async (req, res, next) => {
	//console.log(req.body);  終端機將顯示使用者輸入的帳密
	let { username, password } = req.body;  //提取使用者所輸入的帳密
	//先檢查此名稱是否註冊過
	try {
		let findU = await User.findOne({username});
		//如果在資料庫找到findU，則使用者名稱已存在；沒找到，則開始加密&儲存
		if (findU) {
			res.send("Username exists.");
		} else {
			/* 開始加鹽進行加密，參數1是對應使用者所輸入的純密碼；參數2對應上方salt加鹽次數，參數3的callback則是要開始加密並將資料存入資料庫，參數hash即是將上方的salt加入密碼進行加密 */
			bcrypt.hash(password, saltRounds, (err, hash) => {
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
							//console.log(newUser); 可以看到username與加密的密碼
						})
						.catch((e)=>{
							console.log(e);
							res.send("Failed to save data.")
						});
				} catch(err) {
					next(err);
				}
			});
		}
	} catch (err) {
		next (err);
	}
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
		//補充: if(foundUser)代表資料存在；if(!foundUser)則代表找不到foundUser
		if (foundUser) {
			//bcrypt比較function第1參數對應使用者純密碼、第2參數對應上方的hash(加密過的密碼)
			bcrypt.compare(password, foundUser.password, (err, result) => {
				if (err) {
					next (err);
				}
				if (result === true) {
					//密碼確認後讓認證等於true，可以觸發自訂的middleware認證
					req.session.isVerified = true;
					res.redirect("secret");
				} else {
					res.send("Incorrect username or password.");
				}
			});
		} else {
			res.send("Incorrect username or password.");
		}
		
	} catch (e) {
		next(e);
	}
});
//如果有找到foundUser且密碼沒錯則看到secret；密碼不對或找不到foundUser則進else

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