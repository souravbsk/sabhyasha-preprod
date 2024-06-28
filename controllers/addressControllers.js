const { addreses } = require("../models/AddressModel");
const { users } = require("../models/userModel");
const { slugGenerator } = require("../utlis/slugGenerate");

const addAddress = async (req, res) => {
  try {
    const { type, name, country, city, state, zip, address } = req.body;
    const { userId } = req.params;

    if (!userId || !type || !country || !city || !zip || !address) {
      return res
        .status(400)
        .send({ success: false, message: "Missing required fields" });
    }

    const existingSlugs = await addreses.find({}).distinct("slug");
    const slug = await slugGenerator(address, existingSlugs);

    const newAddress = new addreses({
      user: userId,
      type,
      name,
      country,
      city,
      state,
      zip,
      address,
      slug,
    });

    await newAddress.save();

    await users.findByIdAndUpdate(userId, {
      $push: { shippingAdresses: { id: newAddress._id, data: newAddress } },
    });

    res.send({ success: true, data: newAddress });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

const removeAddress = async (req, res) => {
  try {
    const { slug } = req.params;

    const address = await addreses.findOne({ slug });

    if (!address) {
      return res
        .status(404)
        .send({ success: false, message: "Address not found" });
    }

    await users.findByIdAndUpdate(address.user, {
      $pull: { shippingAdresses: { id: address._id } },
    });

    await addreses.deleteOne({ slug });
    res.send({ success: true, message: "Address removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

module.exports = { addAddress, removeAddress };
