const router = require('express').Router();
const multer = require('multer');
const upload = multer();
const settingsController = require('../controllers/settings.controller');

router.get('/', upload.none(), settingsController.GetSettings);
router.post('/', upload.none(), settingsController.SaveSettings);
router.put('/', upload.none(), settingsController.SaveSettings);

module.exports = router;
