import udp from 'dgram'

const server = udp.createSocket('udp4');

server.on('listening',() => {
    const address = server.address();
    const port = address.port;
    console.log(`Super secret UDP server is listening on port ${port}`);
});

server.on('message',(msg,info) => {
    console.log(`Data received from client: ${msg.toString()}`);
    console.log(`Received ${msg.length} bytes from ${info.address}:${info.port}\n`);

    //sending msg to the client
    const response = Buffer.from('From server: your msg is received');
    server.send(response,info.port,'localhost',(error) => {
        if(error){
            console.log('Got error', error);
        } else{
            console.log('Data sent');
        }
    });
});

server.on('error',(error) => {
    console.log('Error: ' + error);
    server.close();
});

server.bind(80);
