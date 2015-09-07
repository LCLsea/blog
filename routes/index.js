var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js');

module.exports = function(app) {
  /* GET home page. */
  app.get('/', function(req, res, next) {
    Post.getAll(null, function (err, posts) {
      if (err) {
        posts = [];
      }
      res.render('index', {
        title: '主頁',
        user: req.session.user,
        post: posts,
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
        redirect('/login');
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
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
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
