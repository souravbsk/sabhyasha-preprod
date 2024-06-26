const excelToBoolean = (fieldName) => {
  const lowerCaseFieldName = fieldName.toLowerCase();
  if (lowerCaseFieldName === "yes") {
    return true;
  } else if (lowerCaseFieldName === "no") {
    return false;
  } else {
    return false;
  }
};

module.exports = excelToBoolean;
