import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
import indexRoutes from './routes/index';

// Convert __filename and __dirname to ES6 equivalents
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const app = express();

// Use the routes
app.use('/', indexRoutes);

// Define the port to listen on
const port = process.env.PORT || 5000;

// Server starts
app.listen(port, () => {
  console.log(` Express listening on port ${port}`);
});
