export interface ElasticQueryResult<T> {
  hits: ElasticQueryHit<T>
}

interface ElasticQueryHit<T> {
  hits: Array<ElasticQueryHitHit<T>>
}

interface ElasticQueryHitHit<T> {
  _id: string
  _source: T
}
