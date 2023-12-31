const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../../sequelize");

const { INTEGER, UUIDV4, STRING, BOOLEAN, DATE } = DataTypes;

class Code extends Model {}

Code.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		code: {
			type: STRING,
			allowNull: false,
			comment: "Unique code for scanning",
			primaryKey: true
		},
		scanned: {
			type: BOOLEAN,
			allowNull: false,
			defaultValue: false,
			comment: "is scanned"
		},
		codeBatchNo: {
			type: STRING,
			allowNull: true,
			comment: "Legacy Code Batch Number"
		},
		userCode: {
			type: STRING,
			allowNull: true,
			comment: "Legacy User ID Number"
		},
		scannedDate: {
			type: DATE,
			allowNull: true,
			comment: "scanned date"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "To store all test code for scanning",
		tableName: "code",
		modelName: "code",
	}
);

// userId
// codeBatchId

module.exports = Code;
