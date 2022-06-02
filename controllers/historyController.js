const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const History = require('../models/History');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');

exports.getAllHistories = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(
    History.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let histories = await features.query;
  histories = _.uniq(histories.map((item) => item.tour));

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: histories.length,
    histories,
  });
});

exports.getHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyId } = req.params;

  const history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`No history found with the given ID → ${historyId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    history,
  });
});

exports.getHistoriesOnTour = asyncWrapper(async (req, res, next) => {
  const { id: tourId } = req.params;

  let histories = await History.find({ tour: tourId });
  // histories = _.uniq(histories.map((item) => item.user));

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: histories.length,
    histories,
  });
});

exports.createHistory = asyncWrapper(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;

  const history = await History.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    history,
  });
});

exports.updateHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyId } = req.params;

  let history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`No history found with the given ID → ${historyId}`)
    );
  }

  if (
    history.user._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin'
  ) {
    history = await History.findByIdAndUpdate(
      historyId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      history,
    });
  }

  return next(new ForbiddenError('You do not have access to this history'));
});

exports.deleteHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyId } = req.params;

  let history = await History.findById(historyId);

  if (!history) {
    return next(
      new NotFoundError(`No history found with the given ID → ${historyId}`)
    );
  }

  if (
    history.user._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin'
  ) {
    history = await History.findByIdAndDelete(historyId);

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      history: null,
    });
  }

  return next(new ForbiddenError('You do not have access to this history'));
});
