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
  options: [
    {
      label: {
        type: String,
        required: function () {
          return this.type === "select";
        },
      },
      value: {
        type: String,
        required: function () {
          return this.type === "select";
        },
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

customizationModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// const customizedFileds = mongoose.model("customizedFileds", customizationModel);
const customizedFields = mongoose.model(
  "customizedFileds",
  customizationModel,
  "customizedFileds"
);

module.exports = {
  customizedFields,
};
