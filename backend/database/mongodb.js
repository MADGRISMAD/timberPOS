require('dotenv').config();
const {MongoClient, ObjectId} = require('mongodb');
const _url = process.env.DATABASE_URI || 'mongodb://127.0.0.1:27017';
const _dbName = process.env.DATABASE_NAME || 'timber';

const connection = new MongoClient(_url);
let dbConnection = connection.db(_dbName);
let connected = false;

async function ensureConnection() {
  if (connected) return;
  await connection.connect();
  dbConnection = connection.db(_dbName);
  connected = true;
  console.log(`MongoDB connected → ${_dbName} @ ${_url}`);
}

ensureConnection().catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

//Logica de usuario
async function CreateUser(data){
  const result = await dbConnection.collection("users").insertOne(data);
  return result;
}
async function FindUserByEmail(email){
  const result = await dbConnection.collection("users").findOne({email: email});
  return result;
}
async function LoginUsuario(data){
  let find = await FindUserByUsername(data);
  if(find){return find}
  find = await FindUserByEmail(data);
  if(find){return find}
  return null;
}
async function FindUserByUsername(username){
  const result = await dbConnection.collection("users").findOne({username: username});
  return result;
}
//Logica de Mesas
function withMesaId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id), _id };
}

async function AddMesa(data){
  const result = await dbConnection.collection("mesas").insertOne(data);
  const created = await dbConnection.collection("mesas").findOne({ _id: result.insertedId });
  return withMesaId(created);
}
async function UpdateStatusMesa(id,data){
  const clean = { ...data };
  delete clean.id;
  delete clean._id;
  let filter = { numero: parseInt(id, 10) };
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
    filter = { _id: new ObjectId(id) };
  }
  const result = await dbConnection.collection("mesas").updateOne(filter, {$set: clean});
  if (result.matchedCount === 0 && !Number.isNaN(parseInt(id, 10))) {
    return await dbConnection.collection("mesas").updateOne({ numero: parseInt(id, 10) }, {$set: clean});
  }
  return result;
}
async function Getmesas(){
  const result = await dbConnection.collection("mesas").find().toArray();
  return result.map(withMesaId);
}
async function GetMesaById(id){
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
    const byOid = await dbConnection.collection("mesas").findOne({ _id: new ObjectId(id) });
    if (byOid) return withMesaId(byOid);
  }
  const result = await dbConnection.collection("mesas").findOne({nombre: id});
  if(!result){
    return withMesaId(await dbConnection.collection("mesas").findOne({numero: parseInt(id)}));
  }
  return withMesaId(result);
}
async function GetNextMesaNumero(){
  const last = await dbConnection.collection("mesas").find().sort({ numero: -1 }).limit(1).toArray();
  return last.length ? (last[0].numero || 0) + 1 : 1;
}
async function GetMesaFreeWaiter(){
  const result = await dbConnection.collection("mesas").find({disponible: true}).toArray();
  return result.map(withMesaId);
}
async function DeleteMesa(id){
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === String(id)) {
    const byOid = await dbConnection.collection("mesas").deleteOne({ _id: new ObjectId(id) });
    if (byOid.deletedCount) return byOid;
  }
  return await dbConnection.collection("mesas").deleteOne({numero: parseInt(id)});
}
async function CloseMesas(){
  const result = await dbConnection.collection("mesas").updateMany({}, {$set: {disponible: false, personaTitular: null}});
  return result;
}

// Menús y platillos
function withId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { ...rest, id: String(_id), _id };
}

async function GetMenus(){
  const menus = await dbConnection.collection("menus").find().toArray();
  return menus.map(withId);
}
async function GetMenuById(id){
  if (!ObjectId.isValid(id)) return null;
  const menu = await dbConnection.collection("menus").findOne({ _id: new ObjectId(id) });
  if (!menu) return null;
  const foods = await dbConnection.collection("foods").find({ menuId: String(id) }).toArray();
  return { ...withId(menu), foods: foods.map(withId) };
}
async function CreateMenu(data){
  const result = await dbConnection.collection("menus").insertOne(data);
  return withId(await dbConnection.collection("menus").findOne({ _id: result.insertedId }));
}
async function UpdateMenu(id, data){
  if (!ObjectId.isValid(id)) return null;
  const clean = { ...data };
  delete clean.id;
  delete clean._id;
  delete clean.foods;
  await dbConnection.collection("menus").updateOne({ _id: new ObjectId(id) }, { $set: clean });
  return GetMenuById(id);
}
async function DeleteMenu(id){
  if (!ObjectId.isValid(id)) return { deletedCount: 0 };
  await dbConnection.collection("foods").deleteMany({ menuId: String(id) });
  return await dbConnection.collection("menus").deleteOne({ _id: new ObjectId(id) });
}
async function GetFoods(){
  const foods = await dbConnection.collection("foods").find().toArray();
  return foods.map(withId);
}
async function GetFoodById(id){
  if (!ObjectId.isValid(id)) return null;
  return withId(await dbConnection.collection("foods").findOne({ _id: new ObjectId(id) }));
}
async function CreateFood(data){
  const result = await dbConnection.collection("foods").insertOne(data);
  return withId(await dbConnection.collection("foods").findOne({ _id: result.insertedId }));
}
async function UpdateFood(id, data){
  if (!ObjectId.isValid(id)) return null;
  const clean = { ...data };
  delete clean.id;
  delete clean._id;
  await dbConnection.collection("foods").updateOne({ _id: new ObjectId(id) }, { $set: clean });
  return GetFoodById(id);
}
async function DeleteFood(id){
  if (!ObjectId.isValid(id)) return { deletedCount: 0 };
  return await dbConnection.collection("foods").deleteOne({ _id: new ObjectId(id) });
}
//Logica de meseros
async function AddWaiter(data){
  const result = await dbConnection.collection("waiters").insertOne(data);
  return result;
}
async function GetWaiters(){
  const result = await dbConnection.collection("waiters").find().toArray();
  return result;
}
async function GetWaiterByCellphone(id){
  const result = await dbConnection.collection("waiters").findOne({cellphone: id});
  return result;
}
async function GetWaiterByDisponibility(disponibility){
  const result = await dbConnection.collection("waiters").findOne({status: disponibility});
  return result;
}
async function DeleteWaiter(id){
  const result = await dbConnection.collection("waiters").deleteOne({cellphone: id});
  return result;
}
async function UpdateWaiter(id,data){
  const result = await dbConnection.collection("waiters").updateOne({cellphone: id}, {$set: data});
  return result;
}
//Logica de WaitList
async function AddWaitList(data){
  const result = await dbConnection.collection("waitlist").insertOne(data);
  return result;
}
async function GetWaitList(){
  const result = await dbConnection.collection("waitlist").find().toArray();
  return result;
}
async function GetWaitListByNumber(number){
  const result = await dbConnection.collection("waitlist").findOne({cellphone: parseInt(number)});
  return result;
}
async function DeleteWaitList(id){
  console.log(id);
  const result = await dbConnection.collection("waitlist").deleteOne({telefono: id});
  return result;
}

// Configuración del venue (Timber)
async function GetSettings(){
  const result = await dbConnection.collection("settings").findOne({});
  return result;
}
async function CreateSettings(data){
  await dbConnection.collection("settings").insertOne(data);
  return await GetSettings();
}
async function UpdateSettings(data){
  await dbConnection.collection("settings").updateOne({}, {$set: data}, {upsert: true});
  return await GetSettings();
}

// Orders
async function GetOrders(){
  const orders = await dbConnection.collection("orders").find().sort({ createdAt: -1 }).toArray();
  return orders.map(withId);
}
async function GetOrderById(id){
  if (!ObjectId.isValid(id)) return null;
  return withId(await dbConnection.collection("orders").findOne({ _id: new ObjectId(id) }));
}
async function CreateOrder(data){
  const result = await dbConnection.collection("orders").insertOne(data);
  return withId(await dbConnection.collection("orders").findOne({ _id: result.insertedId }));
}
async function UpdateOrder(id, data){
  if (!ObjectId.isValid(id)) return null;
  const clean = { ...data };
  delete clean.id;
  delete clean._id;
  await dbConnection.collection("orders").updateOne({ _id: new ObjectId(id) }, { $set: clean });
  return GetOrderById(id);
}

// Invites
async function GetInvites(){
  const invites = await dbConnection.collection("invites").find().sort({ createdAt: -1 }).toArray();
  return invites.map(withId);
}
async function GetInviteByToken(token){
  return withId(await dbConnection.collection("invites").findOne({ token }));
}
async function CreateInvite(data){
  const result = await dbConnection.collection("invites").insertOne(data);
  return withId(await dbConnection.collection("invites").findOne({ _id: result.insertedId }));
}
async function UpdateInvite(id, data){
  if (!ObjectId.isValid(id)) return null;
  const clean = { ...data };
  delete clean.id;
  delete clean._id;
  await dbConnection.collection("invites").updateOne({ _id: new ObjectId(id) }, { $set: clean });
  return withId(await dbConnection.collection("invites").findOne({ _id: new ObjectId(id) }));
}
async function DeleteInvite(id){
  if (!ObjectId.isValid(id)) return { deletedCount: 0 };
  return await dbConnection.collection("invites").deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
    CreateUser,
    FindUserByEmail,
    LoginUsuario,
    AddMesa,
    UpdateStatusMesa,
    Getmesas,
    GetMesaFreeWaiter,
    GetMesaById,
    DeleteMesa,
    CloseMesas,
    FindUserByUsername,
    AddWaiter,
    GetWaiters,
    GetWaiterByCellphone,
    GetWaiterByDisponibility,
    DeleteWaiter,
    UpdateWaiter,
    AddWaitList,
    GetWaitList,
    GetWaitListByNumber,
    DeleteWaitList,
    GetSettings,
    CreateSettings,
    UpdateSettings,
    GetNextMesaNumero,
    GetMenus,
    GetMenuById,
    CreateMenu,
    UpdateMenu,
    DeleteMenu,
    GetFoods,
    GetFoodById,
    CreateFood,
    UpdateFood,
    DeleteFood,
    GetOrders,
    GetOrderById,
    CreateOrder,
    UpdateOrder,
    GetInvites,
    GetInviteByToken,
    CreateInvite,
    UpdateInvite,
    DeleteInvite,
};