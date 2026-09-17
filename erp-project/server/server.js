import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import dotenv from 'dotenv';
dotenv.config();

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
  });
};

start();
// Server entry
