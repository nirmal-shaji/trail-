const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const uniqueValidator = require("mongoose-unique-validator");

const UserSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true
  },
  phone_number: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  block: {
    type: Boolean,
    default: false
    
  },
  otpVerified: {
    type: Boolean,
    default: false
  }
 
});

  // UserSchema.plugin(uniqueValidator)


UserSchema.pre("save", async function (next) {
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model("User", UserSchema);
// User.create({ first_name: 'ishak', last_name: 'mp', password: '123' }).then(()=> {
//   console.log('test keri');
// })

module.exports = User;
