const createSendToken = (user, statusCode, req, res) => {
  const token = user.generateAuthToken();

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_JWT_EXPIRES_IN * 60 * 60 * 1000
    ),
    httpOnly: true,
    sameSite: true,
    signed: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie('token', token, cookieOptions);

  const { password, ...rest } = user._doc;

  res.status(statusCode).json({
    status: 'success',
    token,
    user: rest,
  });
};

module.exports = createSendToken;
