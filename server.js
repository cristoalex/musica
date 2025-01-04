const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentSong = null;
let currentTime = 0;
let isPlaying = false;

app.use(express.static('public'));

// Ruta para enviar canciones
app.get('/song/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'songs', req.params.filename);
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Content-Length': stat.size,
  });
  fs.createReadStream(filePath).pipe(res);
});

// Sincronización en tiempo real
io.on('connection', (socket) => {
  socket.emit('update', { currentSong, currentTime, isPlaying });

  socket.on('play', (data) => {
    currentSong = data.song;
    currentTime = 0;
    isPlaying = true;
    io.emit('update', { currentSong, currentTime, isPlaying });
  });

  socket.on('pause', () => {
    isPlaying = false;
    io.emit('update', { currentSong, currentTime, isPlaying });
  });

  socket.on('sync', (time) => {
    currentTime = time;
    io.emit('sync', currentTime);
  });
});

server.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
