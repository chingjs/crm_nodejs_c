const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { UUID, UUIDV4 } = DataTypes;

class VoucherBatch extends Model { }

VoucherBatch.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
	
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "Voucher upload batch",
		tableName: "voucherBatch",
		modelName: "voucherBatch"
	}
);

// voucherTypeId

module.exports = VoucherBatch;
