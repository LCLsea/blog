var mongodb = require('./db');

function User(user) {
  this.name = user.name;
  this.password = user.password;
  this.email = user.email;
};

module.exports = User;

// 儲存使用者資訊
User.prototype.save = function(callback) {
  //要存入資料庫的使用者檔案
  var user = {
    name: this.name,
    password: this.password,
    email: this.email
  };
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.insert(user, {
        safe: true
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, user[0]); //成功！ err設為null並回傳儲存後的使用者文件檔
      });
    });
  });
};

//讀取使用者資訊
User.get = function(name, callback) {
  //打開資料庫
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    // 讀取 users 集合
    db.collection('users', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //查詢用戶名 (name鍵) 值為 name 的文件檔
      collection.findOne({
        name: name
      }, function (err, user) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, user); // 成功！回傳查詢的使用者資訊
      });
    });
  });
};
