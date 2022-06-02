const express = require('express');

const commentRouter = require('./comments');
const authController = require('../controllers/authController');
const tourController = require('../controllers/tourController');

const router = express.Router();

router.use('/:tourId/comments', commentRouter);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, tourController.createTour);

router
  .route('/:id')
  .patch(authController.protect, tourController.updateTour)
  .delete(authController.protect, tourController.deleteTour);

router.get(
  '/user/user-tours',
  authController.protect,
  tourController.getToursByUser
);

router.get(
  '/stats',
  authController.protect,
  authController.restrictTo('admin'),
  tourController.getToursStats
);

router.get('/find/:id', tourController.getTourById);

router.get('/search', tourController.searchTours);

router.get('/search/query', tourController.getToursBySearch);

router.get('/tag/:tag', tourController.getToursByTag);

router.get('/tags/:tag', tourController.getToursByTagAgg);

router.get('/details/:slug', tourController.getTourBySlug);

router.post('/related-tours', tourController.getRelatedTours);

router.patch('/like/:id', authController.protect, tourController.likeTour);

module.exports = router;
