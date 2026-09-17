require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const RateLimit = require('express-rate-limit');
const server = require("http").createServer(app);
//Initial configuration

app.set("trust proxy", 1);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());
let corsoptions = require('./configurations/cors.configuration');
app.use(cors(corsoptions));

//Routes
app.use('/usuarios', require('./routers/usuarios.router'));
app.use('/mesas', require('./routers/mesas.router'));
app.use('/tables', require('./routers/tables.router'));
app.use('/menus', require('./routers/menus.router'));
app.use('/foods', require('./routers/foods.router'));
app.use('/waiters', require('./routers/meseros.router'));
app.use('/settings', require('./routers/settings.router'));
app.use('/orders', require('./routers/orders.router'));
app.use('/invites', require('./routers/invites.router'));
server.listen(process.env.PORT, () =>{
    console.log(`Server listening on port ${process.env.PORT}`);
});
