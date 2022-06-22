const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const { StatusCodes } = require('http-status-codes');

const swaggerDocument = YAML.load('./swagger.yaml');

// requiring routes
const auth = require('./routes/auth');
const tour = require('./routes/tours');
const users = require('./routes/users');
const history = require('./routes/history');
const comment = require('./routes/comments');
const bookmark = require('./routes/bookmarks');
const NotFoundError = require('./errors/notFound');
const errorHandlerMiddleware = require('./middlewares/errorHandler');

const app = express();

// global middleware
app.set('trust proxy', 1);
// implement CORS
app.use(cors());

// Access-Control-Allow-Origin
app.options('*', cors());

// set security HTTP headers
app.use(helmet());

// development logging
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

// limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in 15 minutes!',
});

app.use('/api', limiter);

// body Parser, reading data from body into req.body
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));

// cookie parser middleware
app.use(cookieParser(process.env.COOKIE_SECRET));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

// compression
app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);

  next();
});

// swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get('/', (req, res) => {
  res
    .status(StatusCodes.OK)
    .send(`<h1>Touropedia API</h1><a href="/api-docs">Documentation</a>`);
});

// api routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/tours', tour);
app.use('/api/v1/users', users);
app.use('/api/v1/comments', comment);
app.use('/api/v1/histories', history);
app.use('/api/v1/bookmarks', bookmark);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandlerMiddleware);

module.exports = app;
