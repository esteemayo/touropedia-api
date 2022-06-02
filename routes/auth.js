const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signin', authController.signin);

router.post('/google-signin', authController.googleSignIn);

router.post('/forgot-password', authController.forgotPassword);

router.post('/reset-password/:token', authController.resetPassword);

router.patch(
  '/update-my-password',
  authController.protect,
  authController.updatePassword
);

module.exports = router;
