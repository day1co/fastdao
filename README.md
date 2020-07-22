# fastcrud

fast and simple crud using knex

[![npm version](https://badge.fury.io/js/%40fastcampus%2Ffastcrud.svg)](https://badge.fury.io/js/%40fastcampus%2Ffastcrud)

## Getting Started

```js
// const = { connect, CrudOperations } = require('@fastcampus/fastdao');
import { connect, CrudOperations } from '@fastcampus/fastdao';

const knex = connect({ ...  });
const userCrud = CrudOperations.create({ knex, table: 'user' });
await userCrud.select({ ... });
await userCrud.selectFirst({ ... });
await userCrud.selectById(1);
await userCrud.insert({ ... });
await userCrud.updateById(id, { ... });
await userCrud.deleteById(id);
await knex.transaction(tx => {
  try {
    userCrud.transacting(tx).insert(...);
    userCrud.transacting(tx).updateById(...);
    userCrud.transacting(tx).deleteById(...);
    tx.commit();
  } catch(ex) {
    tx.rollback();
  }
});
```

## Contributing

### lint

```console
$ npm run lint
```

### test

```console
$ npm run test
```

may the **SOURCE** be with you...
