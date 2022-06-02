const { StatusCodes } = require('http-status-codes');

const Tour = require('../models/Tour');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');

exports.getAllTours = asyncWrapper(async (req, res, next) => {
  // filtering
  const queryObj = { ...req.query };
  const excludedfields = ['page', 'sort', 'limit', 'fields'];
  excludedfields.forEach((item) => delete queryObj[item]);

  // advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Tour.find(JSON.parse(queryStr));

  // sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // fields limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // paginate
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  const total = await Tour.countDocuments();
  query = query.skip(skip).limit(limit);

  const numberOfPages = Math.ceil(total / limit);

  const tours = await query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: tours.length,
    currentPage: page,
    totalTours: total,
    numberOfPages,
    tours,
  });
});

exports.getToursByUser = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(
    Tour.find({ creator: req.user._id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: tours.length,
    tours,
  });
});

exports.getToursBySearch = asyncWrapper(async (req, res, next) => {
  const { searchQuery } = req.query;

  const title = new RegExp(searchQuery, 'i');
  const tours = await Tour.find({ title });

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: tours.length,
    tours,
  });
});

exports.searchTours = asyncWrapper(async (req, res, next) => {
  const tours = await Tour.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: {
        $meta: 'textScore',
      },
    }
  )
    .sort({
      score: {
        $meta: 'textScore',
      },
    })
    .limit(5);

  res.status(StatusCodes.OK).json({
    status: 'success',
    counts: tours.length,
    tours,
  });
});

exports.getToursByTag = asyncWrapper(async (req, res, next) => {
  const { tag } = req.params;

  const features = new APIFeatures(
    Tour.find({ tags: { $in: [tag] } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: tours.length,
    tours,
  });
});

exports.getToursByTagAgg = asyncWrapper(async (req, res, next) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };

  const tagPromise = Tour.getTagsList();
  const tourPromise = Tour.find({ tags: tagQuery });

  const [tags, tours] = await Promise.all([tagPromise, tourPromise]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    counts: tags.length,
    tours,
    tags,
  });
});

exports.getRelatedTours = asyncWrapper(async (req, res, next) => {
  const tags = req.body;

  const features = new APIFeatures(
    Tour.find({ tags: { $in: tags } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    counts: tours.length,
    tours,
  });
});

exports.getToursStats = asyncWrapper(async (req, res, next) => {
  const now = new Date();
  const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));

  const stats = await Tour.aggregate([
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

exports.getTourById = asyncWrapper(async (req, res, next) => {
  const { id: tourId } = req.params;

  const tour = await Tour.findById(tourId).populate({ path: 'comments' });

  if (!tour) {
    return next(
      new NotFoundError(`No tour found with the given ID → ${tourId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    tour,
  });
});

exports.getTourBySlug = asyncWrapper(async (req, res, next) => {
  const { slug } = req.params;

  const tour = await Tour.findOne({ slug }).populate({ path: 'comments' });

  if (!tour) {
    return next(
      new NotFoundError(`No tour found with the given SLUG → ${slug}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    tour,
  });
});

exports.createTour = asyncWrapper(async (req, res, next) => {
  if (!req.body.name) req.body.name = req.user.name;
  if (!req.body.creator) req.body.creator = req.user._id;

  const tour = await Tour.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    tour,
  });
});

exports.updateTour = asyncWrapper(async (req, res, next) => {
  const { id: tourId } = req.params;

  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(
      new NotFoundError(`No tour found with the given ID → ${tourId}`)
    );
  }

  if (
    tour.creator._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin'
  ) {
    const updTour = await Tour.findByIdAndUpdate(
      tourId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(StatusCodes.OK).json({
      status: 'success',
      tour: updTour,
    });
  }

  return next(
    new ForbiddenError('You are not permitted to perform this operation')
  );
});

exports.likeTour = asyncWrapper(async (req, res, next) => {
  const { id: tourId } = req.params;

  const tour = await Tour.findById(tourId);

  if (!tour) {
    return next(
      new NotFoundError(`No tour found with the given ID → ${tourId}`)
    );
  }

  const index = tour.likes.findIndex((id) => id === String(req.user._id));

  if (index === -1) {
    tour.likes.push(req.user._id);
  } else {
    tour.likes = tour.likes.filter((id) => id !== String(req.user._id));
  }

  const updatedTour = await Tour.findByIdAndUpdate(
    tourId,
    { $set: { ...tour } },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    tour: updatedTour,
  });
});

exports.deleteTour = asyncWrapper(async (req, res, next) => {
  const { id: tourId } = req.params;

  let tour = await Tour.findById(tourId);

  if (!tour) {
    return next(
      new NotFoundError(`No tour found with the given ID → ${tourId}`)
    );
  }

  if (
    tour.creator._id.toString() === req.user._id.toString() ||
    req.user.role === 'admin'
  ) {
    tour = await Tour.findByIdAndDelete(tourId);

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      tour: null,
    });
  }

  return next(
    new ForbiddenError('You are not permitted to perform this operation')
  );
});
