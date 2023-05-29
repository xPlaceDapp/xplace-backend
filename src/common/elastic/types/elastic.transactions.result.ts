import { type ElasticQueryResult } from './elastic.query.result'

interface ElasticTransactionsSource {
  status: string
}

export type ElasticTransactionsResult = ElasticQueryResult<ElasticTransactionsSource>
