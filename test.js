const { mongoConnect, MongoCrudOperations, Schema } = require('./lib');

const config = {
  primary: {
    host: 'localhost',
    port: 27017,
    database: 'fastcampus',
  },
};
const schema = new Schema({
  name: { type: String, require: true },
  email: { type: String, require: true },
  avatar: String,
});

(async () => {
  const mongo = mongoConnect(config);
  const crud = MongoCrudOperations.create({ mongo, table: 'testCollection', schema });

  const data = {
    name: 'Bill',
    email: 'bill@initech.com',
    avatar: 'https://i.imgur.com/dM7Thhn.png',
  };
  const res = await crud.insert(data);
  console.log({ res });
})();
