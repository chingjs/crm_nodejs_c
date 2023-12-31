const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, UUIDV4, STRING, FLOAT, BOOLEAN } = DataTypes;

class VoucherType extends Model {}

VoucherType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      unique: true,
    },
    productId: {
      type: STRING,
      allowNull: false,
      comment: "product id",
    },
    name: {
      type: STRING,
      allowNull: false,
      comment: "Voucher Name",
    },
    description: {
      type: STRING,
      allowNull: true,
      comment: "Voucher description",
    },
    type: {
      type: STRING,
      allowNull: true,
      comment: "Voucher type",
    },
    value: {
      type: STRING,
      allowNull: true,
      comment: "voucher value",
    },
    voucherImage: {
      type: STRING,
      allowNull: false,
      comment: "image key for aws s3",
    },
    points: {
      type: FLOAT,
      allowNull: false,
      comment: "points for redemption",
    },
    active: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: "available for redemption",
    },
  },
  {
    sequelize,
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    comment: "Type of voucher to be redeemed",
    tableName: "voucherType",
    modelName: "voucherType",
  }
);

module.exports = VoucherType;
