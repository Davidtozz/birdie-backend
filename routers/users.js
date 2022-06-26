require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const userRouter = express.Router();
// const socket = require('socket-io');
// const S3 = require('aws-sdk/clients/s3');
// const fs = require('fs');

userRouter.use(express.json());

// TODO Implement multer

const db = mysql.createConnection({
    host: process.env.AWS_RDS_HOSTNAME,
    port: process.env.AWS_RDS_PORT,
    user: process.env.AWS_RDS_USER,
    password: process.env.AWS_RDS_PASSWORD,
    database: process.env.AWS_RDS_DB_NAME,
    
})

/*
const multer = require('multer'); 


const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;
const bucketKey = process.env.AWS_BUCKET_KEY;
const bucketSecret = process.env.AWS_BUCKET_SECRET;

const s3 = new S3({
    bucketRegion,
    bucketKey,
    bucketSecret
})

export function upload(file) {
    const filestream = fs.create
}

*/
// TODO Implement multer





// ! Root route: /api/users
userRouter.get('/', (req, res) => {

    res.status(200).send('<h1>Hello World</h1>');
})

// ! New User route: /api/users/new
userRouter.post("/new", (req, res) => {

    console.log("req.body: ", req.body);

    let username = req.body.username;
    let email = req.body.email
    let psw = req.body.psw


    // userAvatar = req.file;

    // const { username, email, psw  } = req.body;


    let sql =  `INSERT INTO user (username, email, psw) VALUES (?, ?, ?)`;
    // let sql =  `INSERT INTO user (username, email, psw) VALUES (?,?,?)`;


    // db.query(sql,[req.body.username,req.body.email,req.body.psw], (err, result) => {
    db.query(sql, [username,email,psw], (err, result) => {
        if (err) {
        res.status(500).send(`Something went wrong`);
        throw err
        } else {
        console.log(`User created: ${username}`);
        console.log(req.body)
        res.status(200).send(result);
        }
    })
})

// ! Get logged user data
userRouter.get("/:user", (req, res) => {

    let user = req.params.user;

    let sql = `SELECT user_id,username FROM user WHERE username = ?`;
    db.query(sql, [user],(err, result) => {

        if (err) {
        res.status(500).send(`Something went wrong`);
        throw err
        } else {
        console.log(`User retrieved: ${user}`);
        
        res.status(200).send(result); 
        }
    })
})

// ! Login user route: /api/users/login
userRouter.post("/login", (req, res) => {

    let username = req.body.username
    let psw = req.body.psw

    let sql = `SELECT username,psw FROM user WHERE username = ? AND psw = ?`;

    db.query(sql, [username,psw],(err,result) => {

        console.log(`Login Query returned: ${result.length}`)
        console.log(`Query result is an array: ${Array.isArray(result)}`)
        console.log(`Query result length is equal to zero: ${result.length === 0}`)

        if (err){
            console.log(`Invalid username or password for user: ${username}`)
           throw err;
        } 
        
        else if(result.length === 0) { // ! query doesn't return any rows
            res.status(404).send(`Not found. You typed: ${username} ${psw} `)
        } else {
            console.log(`User logged in: ${username}`);
            res.status(200).send(result);
        }
        
        
    })
})

// ! Get logged user's contacts
userRouter.get("/:user/getcontacts", (req, res) => {

    let user = req.params.user
    let id = req.body
  
    
  

    let sql = `
      SELECT message.content, contact.name, user.username, user.user_id
      FROM message 
      RIGHT JOIN contact ON contact.id = message.contact_id
      INNER JOIN user ON contact.user_id = user.user_id
      WHERE user.username = '${user}'
      GROUP BY message.id = (SELECT MAX(message.id) FROM message);
      `   
    db.query(sql, [user],(err,result) => {
  
      if (err) {
        throw err
      } 

      if(result.length === 0) {
        res.status(404).send(`No contacts found for user: ${user}`)
    } else if(result.length > 0) {

        res.status(200).send(result)

        console.log(`Contacts found for user: ${user}`)
        for(let i = 0; i < result.length; i++) {
            console.log(`Contact ${i}: ${result[i].name}`)
        }
    }
      
    })
});

// ! DELETE ROUTE WORKS
userRouter.delete("/:user/deletecontact", (req, res) => {

 
  let user = req.params.user
  let contact = req.body.name;



   console.log(contact)
    // let sql = `DELETE FROM contact WHERE name = ${req.body.name}`;
    let sql = `
    DELETE FROM contact 
    WHERE contact.name = (
      SELECT name 
      FROM (SELECT contact.name FROM contact 
      INNER JOIN user ON contact.user_id = user.user_id 
      WHERE user.username = ? AND contact.name = ?)as T);`
    db.query(sql, [user,contact],(err,result) => {
        
        if (err) {
          throw err
        }
        console.log()
  
        res.status(200).send(`Deleted contact: ${contact}`)
  
    })
  
});

// TODO implement patch route for contacts 

userRouter.post("/:user/addcontact", (req, res) => {

    let user = req.params.user

    let contact =  req.body.name;

   
      console.log(contact);
    
      let sql = `INSERT INTO contact (name,user_id) VALUES ('${contact}', (SELECT user.user_id FROM user WHERE user.username = '${user}'));` // ! sql injection issue 
      db.query( sql, (err, result) => {
        if (err) {
          throw err;
      }
    
      console.log(`Added ${contact.name} to user ${user} contact list` )
      res.status(200).send(result);
      }
      )
    // }
  }
)

// ! Get messages from logged user's contact chat
userRouter.get("/:user/:contact/messages", (req, res) => {

  let user = req.params.user;
  let userContact = req.params.contact;
//! Query to show a chat with a user's contact
  let sql = ` 
  SELECT message.content, contact.name, user.username
  FROM message 
  LEFT JOIN contact ON message.contact_id = contact.id
  LEFT JOIN user ON contact.user_id = user.user_id 
  WHERE contact.name = '${userContact}' 
  AND contact.user_id = (SELECT user.user_id FROM user WHERE user.username = '${user}');`;

  db.query(sql, (err,result) => {

    if(err) {throw err}
    else if(result.length == 0){
      res.status(404).send(`${user}: No messages found for contact ${userContact}`)
    } else {
      console.log(`(${user}) Chat with contact ${userContact}`)
      for (let i=0; i< result.length; i++) {
        console.log(`(${user}) Message ${i}: ${result[i].content}`)
         
      }
      res.status(200).send(result)
    }

  })
})

// ! Send message to a user's contact
userRouter.post("/:user/:contact/message", (req, res) => {

  let user = req.params.user;
  let userContact = req.params.contact;
  let messageContent = req.body.message;

  let sql = 
  `INSERT INTO message (content,contact_id) 
  VALUES ('${messageContent}', (
    SELECT contact.id 
    FROM contact 
    WHERE contact.name = '${userContact}' AND contact.user_id = (
      SELECT user.user_id 
      FROM user 
      WHERE user.username = '${user}')));`;

      db.query(sql, (err,result) => {

        if(err) {throw err;}
        else if(result.length === 0){
          res.status(500).send(`${user}: Unable to send message to requested contact ${userContact}`)
        } else {
          res.status(200).send(result)
        }

      })

})


  //TODO implement UPDATE route for contacts
//   userRouter.patch("/:user/updatecontact", (req, res) => {

//     //TODO implement update contact route 
//   })
module.exports = userRouter 