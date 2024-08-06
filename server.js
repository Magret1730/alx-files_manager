import express from 'express';
import indexRoutes from './routes/index';

const app = express();

// Body Parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Use the routes
app.use('/', indexRoutes);

// Define the port to listen on
const port = process.env.PORT || 5000;

// Server starts
app.listen(port, () => {
  console.log(` Express listening on port ${port}`);
});
