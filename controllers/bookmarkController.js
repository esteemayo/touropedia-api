const { StatusCodes } = require('http-status-codes');

const Bookmark = require('../models/Bookmark');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');
const BadRequestError = require('../errors/badRequest');

exports.getAllBookmarks = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(Bookmark.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookmarks = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: bookmarks.length,
    bookmarks,
  });
});

exports.getUserBookmarks = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(
    Bookmark.find({ user: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookmarks = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: bookmarks.length,
    bookmarks,
  });
});

exports.getBookmark = asyncWrapper(async (req, res, next) => {
  const { id: bookmarkId } = req.params;

  const bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(`No bookmark found with the given ID → ${bookmarkId}`)
    );
  }

  if (
    String(bookmark.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    return res.status(StatusCodes.OK).json({
      status: 'success',
      bookmark,
    });
  }

  return next(new ForbiddenError('You do not have access to this bookmark'));
});

exports.getOneBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { _id: userId },
    params: { tourId },
  } = req;

  const bookmark = await Bookmark.findOne({
    user: userId,
    tour: tourId,
  });

  if (!bookmark) {
    return next(
      new NotFoundError(
        `No bookmark found with the given IDs → ${userId} & ${tourId}`
      )
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    bookmark,
  });
});

exports.createBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { _id: userId },
    body: { tour },
  } = req;

  let bookmark = await Bookmark.findOne({
    user: userId,
    tour,
  });

  if (bookmark) {
    return next(
      new BadRequestError('You already have this tour set as bookmark')
    );
  }

  if (!req.body.user) req.body.user = userId;

  bookmark = await Bookmark.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    bookmark,
  });
});

exports.updateBookmark = asyncWrapper(async (req, res, next) => {
  const { id: bookmarkId } = req.params;

  let bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(`No bookmark found with the given ID → ${bookmarkId}`)
    );
  }

  if (
    String(bookmark.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    bookmark = await Bookmark.findByIdAndUpdate(
      bookmarkId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      bookmark,
    });
  }

  return next(new ForbiddenError('You do not have access to this bookmark'));
});

exports.deleteBookmark = asyncWrapper(async (req, res, next) => {
  const { id: bookmarkId } = req.params;

  let bookmark = await Bookmark.findById(bookmarkId);

  if (!bookmark) {
    return next(
      new NotFoundError(`No bookmark found with the given ID → ${bookmarkId}`)
    );
  }

  if (
    String(bookmark.user._id) === String(req.user._id) ||
    req.user.role === 'admin'
  ) {
    bookmark = await Bookmark.findByIdAndDelete(bookmarkId);

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      bookmark: null,
    });
  }

  return next(new ForbiddenError('You do not have access to this bookmark'));
});
