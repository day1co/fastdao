# fastdao

fast and simple dao using [knex](http://knexjs.org/)

![version](https://img.shields.io/github/package-json/v/day1co/fastdao)

## Getting Started

```js
// const = { connect, CrudOperations } = require('@day1co/fastdao');
import { connect, CrudOperations } from '@day1co/fastdao';

const knex = connect({ ...  });
// to use a separated connection for select
const knexReplica = connect({ ...  });
const postCrud = CrudOperations.create({ knex, knexReplica, table: 'post' });
await postCrud.select({ ... });
await postCrud.selectFirst({ ... });
await postCrud.selectById(1);
await postCrud.count({ ... });
await postCrud.exist({ ... });
await postCrud.insert({ ... });
await postCrud.update({ ... });
await postCrud.updateById(id, { ... });
await postCrud.delete({ ... });
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
