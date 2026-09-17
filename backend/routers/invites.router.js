const router = require('express').Router();
const invites = require('../controllers/invites.controller');

router.get('/', invites.list);
router.post('/', invites.create);
router.get('/token/:token', invites.getByToken);
router.post('/accept', invites.accept);
router.put('/:id/revoke', invites.revoke);
router.delete('/:id', invites.remove);

module.exports = router;
