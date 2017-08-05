'use strict';

module.exports = function(app) {
	var controller = require('../controllers/Controller');

	// controller Routes
	app.route('/track/:address/:depth')
		.get(controller.track);
};
