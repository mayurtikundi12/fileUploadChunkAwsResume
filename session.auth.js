// var auth = function(req, res, next) {
//     if (req.session && req.session.user === "amy" && req.session.admin)
//       return next();
//     else
//       return res.sendStatus(401);
//   };

  const express = require('express');
  const session = require('express-session');


  const two_hours  = 1000 * 60 * 60 * 2;

  const { port = 3000, 
    session_lifetime = two_hours , 
    sess_name = 'sid',
    node_env = "development",
    sess_secret = "secretKey",
  } = process.env;
  
  const in_prod = node_env === 'production';

  const app = express();

  app.use(session({
    name:sess_name,
    resave: false,
    saveUninitialized: false,
    secret : sess_secret,
    cookie: {
    maxAge: session_lifetime,
    sameSite: true,
    secure: in_prod
  }
  }));

  app.get('/', (req, res)=>{
    res.send(`
      <h1>hello</h1>
    `);
  });

  app.get('/register', (req, res)=>{
    
  });

  app.get('/login', (req, res)=>{

  });

  app.get('/home', (req, res)=>{

  });

  app.post('/login', (req, res)=>{
    
  });

  app.post('/register', (req, res)=>{
    
  });

  app.listen(port, ()=>{
    console.log('server running on :::: ', port);
  })