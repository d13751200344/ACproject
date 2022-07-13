const mongoose = require("mongoose");

//製作一個新的資料架構 userSchema
const userSchema = new mongoose.Schema({
    username:{
        type: String,
    },
    password:{
        type: String,
    },
});

// model宣告：將 User 變數 assign 為資料架構 userSchema
const User = mongoose.model("User", userSchema);

// 將 User 變數輸出
module.exports = User;