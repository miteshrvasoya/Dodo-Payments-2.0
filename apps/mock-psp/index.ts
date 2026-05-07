import express from 'express';
import pspRouter from './routes';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use(express.json());

app.use(pspRouter);

app.listen(port, () => {
  console.log(`[INFO] Mock PSP Service is running on port ${port}`);
});
