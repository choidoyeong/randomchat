const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const mongoose = require('mongoose')

const config = require('./config')
const port = process.env.PORT || 3000 

const app = express()
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(morgan('dev'))

app.set('jwt-secret', config.secret)

app.get('/', (req, res) => {
  res.sendFile(__dirname +  '/index.html')
})

app.use('/api', require('./routes/api'))

const finding = 1;
const notFinding = 2;
const chating = 3;

let clients = [];

io.on('connection', function(socket){
  socket.on('nickNameCheck', function(data){
    if(!data.name) {
      socket.emit('nullError', '닉네임을 입력해주세욧!');
      return ;
    }

    for(let a = 0; a < clients.length; a++ ) {
      if(clients[a].name == data.name) {
        socket.emit('sameNameError', '동일한 닉네임이 존재합니다.');
        return ;
      }
    }

    clients.push({
      name: data.name,
      client: socket,
      roomName: '',
      status: notFinding
    });

    socket.name = data.name;
    socket.emit("nickNameCheckComplete");
    io.emit('clientsCount', clients.length)
  });

  socket.on('randomChatFindClick', (data) => {
    console.log(data.name)
    for(let a = 0; a < clients.length; a++) {
      if(clients[a].name == data.name){
        clients[a].status = finding;
        socket.emit('randomChatFindClickComplete')
        return ;
      }
    }
  });

  socket.on('randomChatFinding', (data) => {
    for(let a = 0; a < clients.length; a++) {
      if(clients[a].status == finding){
        if(clients[a].name == data.name) {
          continue;
        } else {
          let roomName = new Date().getTime()+''
          clients[a].status = chating
          clients[a].roomName = roomName
          clients[a].client.join(roomName)

          for(let b = 0; b < clients.length; b++) {
            if(clients[b].name == data.name) {
              clients[b].status = chating
              clients[b].roomName = roomName
              clients[b].client.join(roomName)
              io.to(roomName).emit('randomChatFindingComplete', roomName)
              return ;
            }
          }
        }
      }
    }
  })

  socket.on('message', (result) => {
    io.to(result.roomName).emit('message', result.data)
  })

  socket.on('chatClosingBtn', (data) => {
    io.to(data.roomName).emit('chatEnd')
  })

  socket.on('chatClosing', (data) => {
    for(let a = 0; a < clients.length; a++) {
      if(clients[a].roomName == data.roomName) {
        clients[a].client.join(clients[a].client.id)
        clients[a].roomName = ''
        clients[a].status = notFinding
      }
    }
  })

  socket.on('disconnect', () => {
    for(let a = 0; a < clients.length; a++) {
      if(clients[a].name == socket.name){
        let room = clients[a].roomName
        clients.splice(a, 1)
        io.to(room).emit('discWhileChat')
        io.emit('clientsCount', clients.length)
      }
    }
  })
});

server.listen(port, () => {
  console.log(`Express is running on port ${port}`)
})

mongoose.connect(config.mongodbUri)
const db = mongoose.connection
db.on('error', console.error)
db.once('open', ()=>{
    console.log('connected to mongodb server')
})