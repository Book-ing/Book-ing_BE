const router = require('express').Router();
const mainController = require('../controllers/mainController');
const authMiddelware = require('../middlewares/auth-middlewares');

router.get('/', authMiddelware, mainController.getSelectMainView);

module.exports = router;
