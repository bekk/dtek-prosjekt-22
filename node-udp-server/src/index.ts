import udp from 'dgram'

const server = udp.createSocket('udp4');

const parseMsg = (msg: string) => {
    const msgParts = msg.split(';');
    switch(msgParts[0]){
        case 'ypr':
            console.log(`y: ${msgParts[1]}, p: ${msgParts[2]}, r: ${msgParts[3]}`);
            return
        default:
            console.log(`Unknown msg: ${msg}`)
            return;
    }
}

server.on('listening',() => {
    const address = server.address();
    const port = address.port;
    console.log(`Super secret UDP server is listening on ${address.address} port ${port}`);
});

server.on('message',(msg,info) => {
    parseMsg(msg.toString());
});

server.on('error',(error) => {
    console.log('Error: ' + error);
    server.close();
});

server.bind(8000);

console.log("STARTING");
