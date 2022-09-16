import udp from 'dgram'

const server = udp.createSocket('udp4');

const parseMsg = (msg: string) => {
    const msgParts = msg.split(';');
    const chipId = msgParts[0];
    const eventName = msgParts[1];
    switch(eventName){
        case 'ypr':
            console.log(`${chipId}: y: ${msgParts[2]}, p: ${msgParts[3]}, r: ${msgParts[4]}`);
            return
        case 'btn':
            if(msgParts[2] === '0'){
                console.log(`${chipId}: Button released`);
            } else {
                console.log(`${chipId}: Button pressed`);
            }
            return
        default:
            console.log(`Unknown msg type ${eventName}: ${msg}`)
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
