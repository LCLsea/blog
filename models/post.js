var mongodb = require('./db'),
    markdown = require('markdown').markdown;

function Post(name, title, tags, post) {
  this.name = name;
  this.title = title;
  this.tags = tags;
  this.post = post;
};

module.exports = Post;

Post.prototype.save = function(callback) {
  var date = new Date();
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + "-" + (date.getMonth() + 1),
    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
         date.getDate(),
    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
         date.getDate() + " " + date.getHours() + ':' +
         (date.getMinutes() < 10 ? '0' +
         date.getMinutes() : date.getMinutes())
  };
  //要存入資料庫的文件檔
  var post = {
    name: this.name,
    time: time,
    title: this.title,
    tags: this.tags,
    post: this.post,
    comments: []
  };
  // 打開資料庫
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //讀取posts 集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.insert(post, {
        saft: true
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.getTen = function (name, page, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if (name) {
      query.name = name;
      }
      //根據 query 物件查詢文章
      collection.count(query, function (err, total) {
        collection.find(query, {
          skip: (page-1)*10,
          limit: 10
        }).sort({
          time: -1
        }).toArray(function (err, docs) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          // 解析 markdown 為html
          docs.forEach(function (doc) {
            doc.post = markdown.toHTML(doc.post);
          });
          callback(null, docs, total);  // 成功! 以陣列型式回傳查詢結果
        });
      });
    });
  });
};

Post.getOne = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根據用戶名稱、發表日期及文章名稱進行查詢
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err,doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        if (doc) {
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          })
        }
        callback(null, doc);
      });
    });
  });
};

Post.edit = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);
      });
    });
  });
};

Post.update = function (name, day, title, post, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.update({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        $set: {post: post}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};

Post.remove = function (name, day, title, callback) {
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.remove({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    });
  });
};
