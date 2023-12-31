const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { UUID, UUIDV4, STRING, FLOAT } = DataTypes;

class Sequence extends Model {}

Sequence.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		type: {
			type: STRING,
			allowNull: false,
			comment: "type of column"
		},
		currentSequence: {
			type: FLOAT,
			allowNull: false,
			comment: "current sequence"
		}
	},
	{
		sequelize,
		timestamps: true,
		createdAt: true,
		updatedAt: true,
		comment: "sequence",
		tableName: "sequence",
		modelName: "sequence"
	}
);

module.exports = Sequence;
