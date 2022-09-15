import udp from 'dgram'

const server = udp.createSocket('udp4');

const parseMsg = (msg: string) => {
    const msgParts = msg.split(';');
    const chipId = msgParts[0];
    const eventName = msgParts[1];
    switch(eventName){
        case 'ypr':
            console.log(`y: ${msgParts[2]}, p: ${msgParts[3]}, r: ${msgParts[4]} - from ${chipId}`);
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
