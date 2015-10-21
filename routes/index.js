var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

var multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
    req.flash('success', '檔案上傳成功！貼圖輸入：![](/uploads/'+
      file.originalname + ')');
  }
})

var upload = multer({ storage: storage });

module.exports = function(app) {
  /* GET home page. */
  app.get('/', function(req, res, next) {
    var page = req.query.p ? parseInt(req.query.p) : 1;
    Post.getTen(null, page, function (err, posts, total) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: 'CAMLAB 測試用部落格',
        user: req.session.user,
        posts: posts,
        page: page,
        isFirstPage: (page-1) == 0,
        isLastPage: ((page-1)*10 + posts.length) == total,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res, next) {
    res.render('reg', {
      title: '註冊',
      user: req.session.user,
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res, next) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];

    if (password_re != password) {
      req.flash('error', '輸入密碼不一致!');
      return res.redirect('/reg');
    }
    // 建立密碼的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: req.body.name,
      password: password,
      email: req.body.email
    });
    //檢查用戶名是否已經存在
    User.get(newUser.name, function (err, user) {
      if (user) {
        req.flash('error', '用戶已存在!');
        return res.redirect('/reg')
      }
      newUser.save(function (err, user) {
        if (err) {
          return next(err);
        }
        req.session.user = user; // 使用者資訊存入 session
        req.flash('success', '註冊成功!');
        res.redirect('/') //回傳主頁
      });
    });
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res, next) {
    res.render('login', {
      title: '登入',
      user: req.session.user,
      success: req.flash('success').toString(),
      error :req.flash('error').toString()
    });
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res, next) {
    var md5 = crypto.createHash('md5');
    password = md5.update(req.body.password).digest('hex');
    //檢查用戶是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error', '用戶不存在!');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '密碼錯誤!');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登入成功!');
      res.redirect('/');
    });
  });
  app.get('/post', checkLogin);
  app.get('/post', function(req, res, next) {
    res.render('post', {
      title: '發表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error :  req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function(req, res, next) {
    if (req.body.title == '') {
      req.flash('error', '錯誤！標題欄位不可空白!');
      return res.redirect('back');
    }
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, currentUser.head, req.body.title, tags,
                        req.body.post);
    post.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      req.flash('success', '發佈成功!');
      res.redirect('/');
    });
  });

  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res, next) {
    req.session.user = null;
    req.flash('success', '登出成功!');
    res.redirect('/');
  });

  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res, next) {
    res.render('upload', {
      title: '檔案上傳',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload', checkLogin);
  app.post('/upload', upload.single('imgfile'), function (req, res) {
    res.redirect('/upload');
  });

  app.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      console.log(posts);
      res.render('archive', {
        title: '存檔',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags', function (req, res) {
    Post.getTags(function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tags', {
        title: '標籤',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/tags/:tag', function (req, res) {
    Post.getTag(req.params.tag, function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('tag', {
        title: 'TAG:' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/search', function (req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('search', {
        title: 'SEARCH:' + req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/links', function (req, res) {
    res.render('links', {
      title: '友善連結',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  })

  app.get('/u/:name', function (req, res) {
    //檢查用戶是否存在
    var page = req.query.p ? parseInt(req.query.p) : 1;
    User.get(req.params.name, function (err, user) {
      if(!user) {
        req.flash('error', '用戶不存在！');
        return res.redirect('/');
      }
      Post.getTen(user.name, page, function (err, posts, total) {
        if (err) {
          req.flash('error', err);
          return res.redirect('/');
        }
        res.render('user', {
          title: user.name + '的文章列表',
          posts: posts,
          page: page,
          isFirstPage: (page-1) == 0,
          isLastPage: ((page-1)*10 + posts.length) == total,
          user: req.session.user,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });

  app.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err,
    post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('article', {
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" +
             date.getDate() + " " + date.getHours() + ':' +
             (date.getMinutes() < 10 ? '0' +
             date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + '?s=100';
    var comment = {
        name: req.body.name,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day,
        req.params.title, comment);
    newComment.save(function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '留言成功！');
      res.redirect('back');
    });
  });

  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err,
      post) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('edit', {
        title: '編輯',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title,
      req.body.post, function (err) {
        var url = encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+
           req.params.title);
        if (err) {
          req.flash('error', err);
          return res.redirect(url);  //錯誤！回傳文章頁面
        }
        req.flash('success', '修改成功！');
        res.redirect(url);
    });
  });

  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title,
    function (err) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back');
      }
      req.flash('success', '已刪除！');
      res.redirect('/');
    });
  });

  app.use(function (req, res) {
    res.render("404");
  });
};

function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登入!');
    res.redirect('/login');
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登入!');
    res.redirect('back');
  }
  next();
}
