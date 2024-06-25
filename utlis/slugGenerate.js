const slugify = require("slugify");

const slugGenerator = async (value, existingSlugs = []) => {
  try {
    let generateSlugUrl = slugify(value, {
      replacement: "-",
      lower: true,
      strict: false,
    });

    if (existingSlugs.includes(generateSlugUrl)) {
      let newSlug = generateSlugUrl;

      while (existingSlugs.includes(newSlug)) {
        const randomSuffix = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 9999
        newSlug = `${generateSlugUrl}-${randomSuffix}`;
      }

      generateSlugUrl = newSlug;
    }

    return generateSlugUrl;
  } catch (error) {
    throw error;
  }
};

const slugModifyGenerate = async (value, existCollection) => {
  try {
    let generateSlugUrl = await slugify(value, {
      replacement: "-",
      lower: true,
      strict: false,
    });

    // Check if the generated slug already exists
    const existingCategory = await existCollection.findOne({
      slug: generateSlugUrl,
    });

    if (existingCategory) {
      throw new Error("Same slug already exists");
    }

    return generateSlugUrl;
  } catch (error) {
    throw error;
  }
};

module.exports = { slugGenerator, slugModifyGenerate };
