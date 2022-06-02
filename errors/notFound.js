const { StatusCodes } = require('http-status-codes');
const CustomAPIError = require('./customApiError');

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);

    this.status = 'fail';
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

module.exports = NotFoundError;
