const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({

  email: {
    type: String,
    // unique:true
  },
  password: {
    type: String,
  },
});

const admin = mongoose.model("admin", adminSchema);

module.exports = admin;
