const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'An history must belong to a user'],
    },
    tour: {
      type: mongoose.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'An history must belong to a tour'],
    },
  },
  {
    timestamps: true,
  }
);

historySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name avatar',
  }).populate({
    path: 'tour',
    select: 'title name',
  });

  next();
});

const History = mongoose.model('History', historySchema);

module.exports = History;
