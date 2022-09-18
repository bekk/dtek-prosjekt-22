import udp from "node:dgram";
import http from "node:http";
import EventEmitter from "node:events";
import { WebSocketServer } from "ws";
import sqlite from "sqlite3";

interface Database {
  append: (id: string, data: string) => Promise<void>;
  retrieve: () => Promise<Array<DatabaseChunk>>;
  addAppendListener: (fn: ListenerFn) => void;
  removeAppendListener: (fn: ListenerFn) => void;
}

interface DatabaseChunk {
  id: string;
  data: string;
  ts: Date;
}

type ListenerFn = (newChunk: DatabaseChunk) => void;

function createDatabase(): Database {
  const emitter = new EventEmitter();
  let state: Array<DatabaseChunk> = [];

  const db = new sqlite.Database(":memory:");

  db.run("CREATE TABLE chunks (id TEXT, data TEXT, ts INTEGER)");

  return {
    async append(id: string, data: string) {
      const ts = new Date();

      const chunk = { id, data, ts };

      return new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO chunks (id, data, ts) VALUES (?, ?, ?)",
          [id, data, ts],
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();

              emitter.emit("chunk", chunk);
            }
          }
        );
      });
    },
    async retrieve() {
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT id, data, ts FROM chunks",
          (err, rows: Array<{ id: string; data: string; ts: number }>) => {
            if (err) {
              reject(err);
            } else {
              resolve(
                rows.map((row) => ({
                  id: row.id,
                  data: row.data,
                  ts: new Date(row.ts),
                }))
              );
            }
          }
        );
      });
    },
    addAppendListener(fn: ListenerFn) {
      emitter.on("chunk", fn);
    },
    removeAppendListener(fn: ListenerFn) {
      emitter.removeListener("chunk", fn);
    },
  };
}

function createWebServer({ port, db }: { port: number; db: Database }) {
  const wsServer = new WebSocketServer({ port: 8002 });

  db.addAppendListener((data) =>
    wsServer.clients.forEach((ws) => ws.send(JSON.stringify(data)))
  );

  const server = http.createServer(async (req, res) => {
    const host = req.headers.host || "localhost";
    const url = new URL(`http://${host}${req.url}`);

    if (req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      switch (url.pathname) {
        case "/metrics":
          const metricsData = {
            db: {
              chunkNum: (await db.retrieve()).length,
            },
            ws: {
              connectionNum: wsServer.clients.size,
            },
          };
          res.write(JSON.stringify(metricsData));
          break;
        default:
          const data = { chunks: await db.retrieve() };
          res.write(JSON.stringify(data));
      }

      res.end();
    }
  });

  server.listen(port, () =>
    console.log(`Super secret HTTP/WebSocket server listening on port ${port}`)
  );
}

function createDatagramServer({
  port,
  db,
  demo = false,
}: {
  port: number;
  db: Database;
  demo?: boolean;
}) {
  const server = udp.createSocket("udp4");

  /*
    Message format

    <id>;<data>

    id   = /[A-Za-z0-9]+/
    data = any data

    */

  // const parseMsg = (msg: string) => {
  //     const msgParts = msg.split(';');
  //     switch (msgParts[0]) {
  //         case 'ypr':
  //             console.log(`y: ${msgParts[1]}, p: ${msgParts[2]}, r: ${msgParts[3]}`);
  //             return
  //         default:
  //             console.log(`Unknown msg: ${msg}`)
  //             return;
  //     }
  // }

  const MSG_FORMAT_REGEX = new RegExp(/^[a-zA-Z0-9]+;.*$/);

  server.on("listening", () => {
    const serverAddress = server.address().address;
    const serverPort = server.address().port;
    console.log(
      `Super secret UDP server is listening on ${serverAddress} port ${serverPort}`
    );

    if (demo) {
      const client = udp.createSocket("udp4");

      setInterval(
        () => client.send("demo;ypr;1;2;3", serverPort, serverAddress),
        1000
      );

      console.log(`Starting in demo mode.`);
    }
  });

  server.on("message", (msg, info) => {
    const msgString = msg.toString();

    if (!MSG_FORMAT_REGEX.test(msgString)) {
      console.info(
        `level=info msg="Invalid message received" received="${msgString}" address=${info.address}`
      );
      return;
    }

    const sepIndex = msgString.indexOf(";");
    const id = msgString.slice(0, sepIndex);
    const data = msgString.slice(sepIndex + 1);

    console.debug(
      `level=debug msg="Message received" id=${id} data="${data}" address=${info.address}`
    );
    db.append(id, data);
  });

  server.on("error", (error) => {
    console.log("Error: " + error);
    server.close();
  });

  server.bind(port);
}

console.log("STARTING");

const isDemo = process.argv[2] === "--demo";

const db = createDatabase();

createDatagramServer({ port: 8000, db, demo: isDemo });
createWebServer({ port: 8001, db });
