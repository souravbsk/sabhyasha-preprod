const { default: mongoose } = require("mongoose");

const customizationModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "select"],
    required: true,
  },
  textValue: {
    type: String,
    required: function () {
      return this.type === "text";
    },
  },
  options: {
    type: [String],
    required: function () {
      return this.type === "select";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

customizationModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Customization = mongoose.model("Customization", customizationModel);

module.exports = {
  Customization,
};
