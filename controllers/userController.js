const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const Tour = require('../models/Tour');
const factory = require('./handlerFactory');
const Bookmark = require('../models/Bookmark');
const asyncWrapper = require('../utils/asyncWrapper');
const BadRequestError = require('../errors/badRequest');
const createSendToken = require('../middlewares/createSendToken');

exports.signup = asyncWrapper(async (req, res, next) => {
  const {
    role,
    email,
    avatar,
    password,
    lastName,
    firstName,
    passwordConfirm,
    passwordChangedAt,
  } = req.body;

  const newUser = {
    name: `${firstName} ${lastName}`,
    role,
    email,
    avatar,
    password,
    passwordConfirm,
    passwordChangedAt,
  };

  const user = await User.create({ ...newUser });

  createSendToken(user, StatusCodes.CREATED, req, res);
});

exports.getAllUsers = asyncWrapper(async (req, res, next) => {
  const query = req.query.new;

  const users = query
    ? await User.find().limit(5).sort('-_id')
    : await User.find().sort('-createdAt');

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: users.length,
    users,
  });
});

exports.getUsersStats = asyncWrapper(async (req, res, next) => {
  const now = new Date();
  const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));

  const stats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: lastYear },
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: 1 },
      },
    },
  ]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    stats,
  });
});

exports.updateMe = asyncWrapper(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (password || passwordConfirm) {
    return next(
      new BadRequestError(
        `This route is not for password updates. Please use update ${
          req.protocol
        }://${req.get('host')}/api/v1/auth/update-my-password`
      )
    );
  }

  const filterBody = _.pick(req.body, ['name', 'email', 'avatar']);
  const updUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { ...filterBody } },
    {
      new: true,
      runValidators: true,
    }
  );

  createSendToken(updUser, StatusCodes.OK, req, res);
});

exports.deleteMe = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  await Tour.deleteMany({ creator: user._id });
  await Bookmark.deleteMany({ user: user._id });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.createUser = (req, res) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/signup instead`,
  });
};

exports.getUser = factory.getOneById(User);
// do NOT update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
