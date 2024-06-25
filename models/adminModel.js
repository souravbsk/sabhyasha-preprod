const { default: mongoose } = require("mongoose");

const adminModel = new mongoose.Schema({
  displayName: String,
  email: String,
  avatar: String,
  mobile: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

adminModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Admin = mongoose.model("Admin", adminModel);

module.exports = {
  Admin,
};
