import udp from 'dgram'

//const serverAddress = 'localhost'
const serverAddress = '192.168.1.38'
const serverPort = 8000

var buffer = require('buffer');

// creating a client socket
var client = udp.createSocket('udp4');

//buffer msg
var data = Buffer.from('siddheshrane');

client.on('message',function(msg,info){
    console.log('Data received from server : ' + msg.toString());
    console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
});

//sending msg
client.send(data,serverPort,serverAddress,function(error){
    if(error){
        client.close();
    }else{
        console.log('Data sent !!!');
    }
});

var data1 = Buffer.from('hello');
var data2 = Buffer.from('world');

//sending multiple msg
client.send([data1,data2],serverPort,serverAddress,function(error) {
    if (error) {
        client.close();
    } else {
        console.log('Data sent !!!');
    }
});
