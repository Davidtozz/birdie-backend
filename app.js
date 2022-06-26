require("dotenv").config();

const mysql = require('mysql');
const fs = require('fs');
const express = require("express");
const app = express();


//jbvwbwbvowbov

const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

//connect to db
const db = mysql.createConnection({
    host: process.env.AWS_RDS_HOSTNAME,
    port: process.env.AWS_RDS_PORT,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    database: process.env.AWS_RDS_DB_NAME,
});

let hello = '';

db.connect((err) => {
    if (err) {
      hello = 'failed';  
      throw err;
    }
    console.log("Database connection successful");
    hello = "Database connection successful";
  });


  
  app.post("/api/postmessages", (req, res) => {
  
    //  let message = req.body;
     console.log(req.body.message);
  
     let sql = "INSERT INTO message (content) VALUES ('"+req.body.message +"');"
     db.query( sql, (err, result) => {
        if (err) {
            throw err;
          }
          console.log(result);
     })
  })
  
  
  app.get("/api/getmessages", (req, res) => {
    let sql = "SELECT content FROM message";
    db.query(sql, (err, result) => {
      if (err) {
        throw err;
      }
  
      console.log(`\nCurrent chat messages: ${result}`);
    
      // console.log('messages sent: '+element)
      res.send(result);
    })
  })
  

// ? Ideally, this route should return a portfolio of projects that the user has created.
app.get('/', (req, res) => {
    res.send(fs.readFileSync('index.html', 'utf8'));
});



const userRouter = require('./routers/users.js');
// const chatRouter = require('./routers/ws-chat.js');
app.use('/api/users', userRouter);
// app.use('/api/chat', chatRouter);

//listen on port 3000
app.listen(port, () => {
    console.log('Server is listening on port '+ port);
});