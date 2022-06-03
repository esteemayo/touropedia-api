const jwt = require('jsonwebtoken');

const User = require('../models/User');
const asyncWrapper = require('../utils/asyncWrapper');

const auth = asyncWrapper(async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const isCustomAuth = token.length < 500;
  let decodedData;

  if (token && isCustomAuth) {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedData?.id;
  } else {
    decodedData = jwt.decode(token);
    const googleId = decodedData?.sub.toString();
    const user = await User.findOne({ googleId });
    req.userId = user?._id;
  }

  next();
});

module.exports = auth;
