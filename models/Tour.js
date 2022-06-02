const slugify = require('slugify');
const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a title'],
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 charaters'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    slug: String,
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
    },
    creator: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A tour must belong to a user'],
    },
    tags: {
      type: Array,
      isAsync: true,
      validate: {
        validator: function (item) {
          return item && item.length > 0;
        },
        message: 'A tour should have at least one tag',
      },
    },
    image: {
      type: String,
      default: '',
    },
    likes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourSchema.index({
  title: 'text',
  description: 'text',
});

tourSchema.index({ title: 1, tags: 1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'tour',
});

tourSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, { lower: true });

  const tourRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const tourWithSlug = await this.constructor.find({ slug: tourRegEx });

  if (tourWithSlug.length) {
    this.slug = `${this.slug}-${tourWithSlug.length + 1}`;
  }
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'creator',
    select: 'name email avatar',
  });

  next();
});

tourSchema.statics.getTagsList = function () {
  return this.aggregate([
    {
      $unwind: '$tags',
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
