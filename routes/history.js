const express = require('express');

const authController = require('../controllers/authController');
const historyController = require('../controllers/historyController');

const router = express.Router();

router.get('/tour/:id', historyController.getHistoriesOnTour);

router.use(authController.protect);

router
  .route('/')
  .get(historyController.getAllHistories)
  .post(historyController.createHistory);

router.use(authController.restrictTo('admin'));

router
  .route('/:id')
  .get(historyController.getHistory)
  .patch(historyController.updateHistory)
  .delete(historyController.deleteHistory);

module.exports = router;
