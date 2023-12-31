const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const { STRING, BOOLEAN, FLOAT } = DataTypes;

class Rating extends Model { }

Rating.init(
	{
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
			unique: true
		},
		rating: {
			type: FLOAT,
			allowNull: false,
			comment: "rate stars"
		},
		review: {
			type: STRING,
			allowNull: true,
			comment: "user comment"
		},
		status: {
			type: STRING,
			allowNull: false,
			comment: "status validate"
		},
		trackingId: {
			type: STRING,
			allowNull: false,
			comment: "rate stars"
		},
	
	},
	{
		sequelize,
		comment: "To store all rating details",
		tableName: "rating",
		modelName: "rating"
	}
);

module.exports = Rating;
