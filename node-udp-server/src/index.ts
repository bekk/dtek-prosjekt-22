import udp from "node:dgram";
import http from "node:http";
import EventEmitter from "node:events";
import { AddressInfo } from "node:net";
import { WebSocketServer } from "ws";
import sqlite from "sqlite3";

interface Database {
  append: (id: string, fields: Array<ChunkField>) => Promise<void>;
  retrieve: () => Promise<Array<DatabaseChunk>>;
  addAppendListener: (fn: ListenerFn) => void;
  removeAppendListener: (fn: ListenerFn) => void;
}

interface ChunkField {
  name: string;
  data: Array<string>;
}

interface DatabaseChunk {
  id: string;
  fields: Array<ChunkField>;
  ts: Date;
}

type ListenerFn = (newChunk: DatabaseChunk) => void;

async function createDatabase(dbPath: string = ":memory:"): Promise<Database> {
  const emitter = new EventEmitter();
  const db = new sqlite.Database(dbPath);

  console.log(`level=info msg="Using database ${dbPath}."`);

  await new Promise<void>((resolve, reject) => {
    db.get(
      "SELECT name FROM sqlite_schema WHERE name = 'chunks'",
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row === undefined) {
            db.run(
              "CREATE TABLE chunks (id TEXT, fields TEXT, ts INTEGER)",
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`level=info msg="Using new table 'chunks'."`);
                  resolve();
                }
              }
            );
          } else {
            console.log(`level=info msg="Using table 'chunks'."`);
            resolve();
          }
        }
      }
    );
  });

  return {
    async append(id: string, fields: Array<ChunkField>) {
      const ts = new Date();
      return new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO chunks (id, fields, ts) VALUES (?, ?, ?)",
          [id, JSON.stringify(fields), ts],
          (err) => {
            if (err) {
              reject(err);
            } else {
              emitter.emit("chunk", { id, fields, ts });
              resolve();
            }
          }
        );
      });
    },
    async retrieve() {
      return new Promise((resolve, reject) => {
        db.all(
          "SELECT id, fields, ts FROM chunks",
          (err, rows: Array<{ id: string; fields: string; ts: number }>) => {
            if (err) {
              reject(err);
            } else {
              resolve(
                rows.map((row) => ({
                  id: row.id,
                  fields: JSON.parse(row.fields),
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

  server.listen(port, () => {
    const address = server.address() as AddressInfo;
    console.log(
      `level=info msg="HTTP/WebSocket server listening on port ${address.address}:${address.port}"`
    );
  });
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

  server.on("listening", () => {
    const serverAddress = server.address().address;
    const serverPort = server.address().port;
    console.log(
      `level=info msg="UDP server is listening on ${serverAddress}:${serverPort}."`
    );

    if (demo) {
      const client = udp.createSocket("udp4");

      setInterval(() => {
        const y = Math.random() * 2 - 1;
        const p = Math.random() * 2 - 1;
        const r = Math.random() * 2 - 1;
        client.send(`demo;ypr;${y};${p};${r}`, serverPort, serverAddress);
      }, 1000);

      console.log(`level=info msg="Starting in demo mode."`);
    }
  });

  server.on("message", (msg, info) => {
    const msgString = msg.toString();

    const parts = msgString.split(";");

    if (parts.length < 2) {
      console.log(`level=debug msg="Too few parts." data="${msgString}"`);
      return;
    }

    const id = parts[0];

    const fields = [{ name: parts[1], data: parts.slice(2) }];

    console.debug(
      `level=debug msg="Message received." id=${id} fields="${JSON.stringify(
        fields
      )}" address=${info.address}`
    );
    db.append(id, fields);
  });

  server.on("error", (error) => {
    console.error(`level=error msg="${error}"`);
    server.close();
  });

  server.bind(port);
}

console.log('level=info msg="Starting super secret D+T server."');

const isDemo = process.argv.includes("--demo");

const dbPath = (() => {
  const dbPos = process.argv.indexOf("--db");
  if (dbPos === -1) {
    return ":memory:";
  }
  const value = process.argv[dbPos + 1];
  if (value === undefined) {
    console.error(`level=error msg="--db must be succeeded by a value."`);
    process.exit(1);
  }
  return value;
})();

createDatabase(dbPath).then((db) => {
  createDatagramServer({ port: 8000, db, demo: isDemo });
  createWebServer({ port: 8001, db });
});
