# fastdao

fast and simple dao using [knex](http://knexjs.org/)

[![npm version](https://badge.fury.io/js/%40fastcampus%2Ffastcrud.svg)](https://badge.fury.io/js/%40fastcampus%2Ffastcrud)

## Getting Started

```js
// const = { connect, CrudOperations } = require('@fastcampus/fastdao');
import { connect, CrudOperations } from '@fastcampus/fastdao';

const knex = connect({ ...  });
// to use a separated connection for select
const knexReplica = connect({ ...  });
const postCrud = CrudOperations.create({ knex, knexReplica, table: 'post' });
await postCrud.select({ ... });
await postCrud.selectFirst({ ... });
await postCrud.selectById(1);
await postCrud.insert({ ... });
await postCrud.updateById(id, { ... });
await postCrud.deleteById(id);
await knex.transaction(async (tx) => {
  await postCrud.transacting(tx).insert(...);
  await postCrud.transacting(tx).updateById(...);
  await postCrud.transacting(tx).deleteById(...);
});
```

## Contributing

### test

```console
$ npm test
```

### build

```console
$ npm run build
```

### watch(continuous build)

```console
$ npm start
```

---
may the **SOURCE** be with you...
