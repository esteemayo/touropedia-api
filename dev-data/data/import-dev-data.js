require('colors');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// models
const Tour = require('../../models/Tour');
const User = require('../../models/User');
const Comment = require('../../models/Comment');
const History = require('../../models/History');
const Bookmark = require('../../models/Bookmark');

dotenv.config({ path: './config.env' });

// db local
const dbLocal = process.env.DATABASE_LOCAL;

// atlas mongo uri
const mongoURI = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// MongoDB connection
mongoose
  .connect(dbLocal)
  .then(() =>
    console.log(`Connnected to MongoDB Successfully → ${dbLocal}`.gray.bold)
  )
  .catch((err) =>
    console.log(`Could not connect to MongoDB → ${err}`.red.bold)
  );

// read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const comments = JSON.parse(
  fs.readFileSync(`${__dirname}/comments.json`, 'utf-8')
);

// import data into database
const loadData = async () => {
  try {
    await Tour.create({ ...tours });
    await User.create(users, { validateBeforeSave: false });
    await Comment.create({ ...comments });
    console.log('👍👍👍👍👍👍👍👍 Done!'.green.bold);
    process.exit();
  } catch (err) {
    console.log(
      '\n👎👎👎👎👎👎👎👎 Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n'
        .red.bold
    );
    console.log(err);
    process.exit();
  }
};

// delete data from database
const removeData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Comment.deleteMany();
    await History.deleteMany();
    await Bookmark.deleteMany();
    console.log(
      'Data Deleted. To load sample data, run\n\n\t npm run sample\n\n'.green
        .bold
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  loadData();
} else if (process.argv[2] === '--remove') {
  removeData();
}
