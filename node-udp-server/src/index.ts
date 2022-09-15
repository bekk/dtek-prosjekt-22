import udp from 'dgram'
import http from 'node:http'

interface Database {
    store: (msg: string) => void;
    retrieve: () => Array<DatabaseChunk>;
}

interface DatabaseChunk {
    msg: string;
    ts: Date;
}

function createDatabase(): Database {
    let state: Array<DatabaseChunk> = [];
    return {
        store(msg: string) {
            state.push({msg, ts: new Date()});
        },
        retrieve() {
            return state.slice();
        }
    }
}

function createWebServer({port, db}: {port: number, db: Database}) {
    const server = http.createServer(async (req, res) => {
        if (req.method === 'GET') {
            const data = { data: db.retrieve() };
            res.writeHead(200, {'content-type': 'application/json'});
            res.write(JSON.stringify(data));
            res.end();
        }
    });

    server.listen(port, () => console.log(`Super secret HTTP server listening on port ${port}`));
}

function createDatagramServer({port, db, demo = false}: {port: number, db: Database, demo?: boolean}) {
    const server = udp.createSocket('udp4');
    
    const parseMsg = (msg: string) => {
        const msgParts = msg.split(';');
        switch (msgParts[0]) {
            case 'ypr':
                console.log(`y: ${msgParts[1]}, p: ${msgParts[2]}, r: ${msgParts[3]}`);
                return
            default:
                console.log(`Unknown msg: ${msg}`)
                return;
        }
    }

    server.on('listening', () => {
        const serverAddress = server.address().address;
        const serverPort = server.address().port;
        console.log(`Super secret UDP server is listening on ${serverAddress} port ${serverPort}`);
    
        if (demo) {
            const client = udp.createSocket('udp4');

            setInterval(() => {
                // const data = Buffer.from('ypr;1;2;3');
                client.send('ypr;1;2;3', serverPort, serverAddress);
            }, 1000);

            console.log(`Starting in demo mode.`);

        }
    });

    server.on('message', (msg, info) => {
        db.store(msg.toString());
        
        parseMsg(msg.toString());

    });

    server.on('error', (error) => {
        console.log('Error: ' + error);
        server.close();
    });

    

    server.bind(port);
}


console.log("STARTING")

const isDemo = process.argv[2] === '--demo';

const db = createDatabase();

createDatagramServer({port: 8000, db, demo: isDemo});
createWebServer({port: 8001, db});
