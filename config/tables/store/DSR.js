const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING, BOOLEAN, FLOAT, DATE } = DataTypes;

class DSR extends Model {}

DSR.init(
  {
    id: {
      type: UUID,
      primaryKey: true,
      unique: true,
      defaultValue: UUIDV4,
    },
    code: {
      type: STRING,
      allowNull: true,
      comment: "store code ",
    },
    name: {
      type: STRING,
      allowNull: false,
      comment: "store name",
    },
    store_type: {
      type: STRING,
      allowNull: true,
      comment: "store type",
    },
    store_group: {
      type: STRING,
      allowNull: true,
      comment: "store group",
    },
    qrcode: {
      type: STRING,
      allowNull: true,
      comment: "qrcode of the store",
    },
    verified: {
      type: BOOLEAN,
      defaultValue: false,
      comment: "qrcode of the store",
    },
    region: {
      type: STRING,
      allowNull: false,
      comment: "Region of the store",
    },
    address: {
      type: STRING,
      allowNull: true,
      comment: "Address",
    },
    number: {
      type: STRING,
      allowNull: true,
      comment: "Retailer Login",
    },
    city: {
      type: STRING,
      allowNull: true,
      comment: "City",
    },
    state: {
      type: STRING,
      allowNull: true,
      comment: "State",
    },
    postcode: {
      type: STRING,
      allowNull: true,
      comment: "Post Code",
    },
    status: {
      type: STRING,
      allowNull: true,
      comment: "Status of the dsr",
    },
    first_scan_date: {
      type: DATE,
      allowNull: true,
      comment: "First Scan Date of the dsr",
    },
    last_activity_date: {
      type: DATE,
      allowNull: true,
      comment: "last activity Date of the dsr",
    },
    registration_date: {
      type: DATE,
      allowNull: true,
      comment: "Registration Date of the dsr",
    },
    active: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "status of the user",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "To store all dsr details",
    tableName: "dsr",
    modelName: "dsr",
  }
);

module.exports = DSR;
