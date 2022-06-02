require('colors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down...'.red.bold);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// db local
const dbLocal = process.env.DATABASE_LOCAL;

// atlas mongo uri
const mongoURI = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const devEnv = process.env.NODE_ENV !== 'production';

// MongoDB Connevtion
mongoose
  .connect(`${devEnv ? dbLocal : mongoURI}`)
  .then(() =>
    console.log(
      `Connected to MongoDB Successfully → ${devEnv ? dbLocal : mongoURI}`.gray
        .bold
    )
  );

// start server
app.set('port', process.env.PORT || 5555);

const server = app.listen(app.get('port'), () =>
  console.log(`Server running on port → ${server.address().port}`.blue.bold)
);

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 🔥 Shutting down...'.red.bold);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👏 SIGTERM RECEIVED, Shutting down gracefully');
  server.close(() => {
    console.log('🔥 Process terminated...');
  });
});
