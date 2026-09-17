const router = require('express').Router();
const tables = require('../controllers/tables.controller');

router.get('/', tables.list);
router.get('/:id', tables.getById);
router.post('/', tables.create);
router.put('/:id', tables.update);
router.delete('/:id', tables.remove);

module.exports = router;
