const routeNotFoundHandler = (req, res) => {
	return res.status(500).send({ error: 'Invalid Path' });
};

async function unhandledRejectionHandler(error) {
	console.error('unhandledRejection:', error);
}

async function uncaughtExceptionHandler(error) {
	console.error('uncaughtExceptionHandler:', error);

}

// eslint-disable-next-line no-unused-vars
async function globalErrorHandler(err, req, res, next) {
	console.error('globalErrorHandler:', err);

	return res.status(500).send({ error: 'Internal Server Error' });
}

module.exports = {
	uncaughtExceptionHandler,
	unhandledRejectionHandler,
	globalErrorHandler,
	routeNotFoundHandler,
};
