let instance = null;
const mongoose = require('mongoose');

class Database {
  constructor() {
    if (!instance) instance = this;
    return instance;
  }

  async connect(uri) {
    try {
      if (!uri) {
        throw new Error("MongoDB connection string is missing");
      }
      await mongoose.connect(uri);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Database;
