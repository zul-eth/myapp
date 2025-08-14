export class DomainError extends Error { code = "DOMAIN_ERROR"; constructor(m: string){ super(m); } }
export class NotFoundError extends DomainError { code = "NOT_FOUND"; constructor(m="Not found"){ super(m); } }
export class ValidationError extends DomainError { code = "VALIDATION"; constructor(m="Invalid data"){ super(m); } }
export class ConflictError extends DomainError { code = "CONFLICT"; constructor(m="Conflict"){ super(m); } }
