const { StatusCodes } = require('http-status-codes');

const Comment = require('../models/Comment');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');

exports.getAllComments = asyncWrapper(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const features = new APIFeatures(Comment.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const comments = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: comments.length,
    comments,
  });
});

exports.getCommentStats = asyncWrapper(async (req, res, next) => {
  const now = new Date();
  const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));

  const stats = await Comment.aggregate([
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

exports.getComment = asyncWrapper(async (req, res, next) => {
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(`No comment found with the given ID → ${commentId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    comment,
  });
});

exports.createComment = asyncWrapper(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user._id;
  if (!req.body.tour) req.body.tour = req.params.tourId;

  const comment = await Comment.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    comment,
  });
});

exports.updateComment = asyncWrapper(async (req, res, next) => {
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(`No comment found with the given ID → ${commentId}`)
    );
  }

  if (
    String(comment.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      comment: updatedComment,
    });
  }

  return next(
    new ForbiddenError('You are not permitted to perform this operation')
  );
});

exports.deleteComment = asyncWrapper(async (req, res, next) => {
  const { id: commentId } = req.params;

  let comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(`No comment found with the given ID → ${commentId}`)
    );
  }

  if (
    String(comment.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    comment = await Comment.findByIdAndDelete(commentId);

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      comment: null,
    });
  }

  return next(
    new NotFoundError('You are not permitted to perform this operation')
  );
});
