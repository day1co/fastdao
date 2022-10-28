val selectOps: SelectOps = new FastDao({ type: mongo, host: ..., port: ... }).getSelectOps()
val userQueryService: UserQueryService = new DefaultUserQueryService(selectOps);

class DefaultUserQueryService implements UserQueryService { 
  constructor(selectOps: SelectOps); 
  findById(id) {
   return this.selectOps.select(...); 
  } 
}