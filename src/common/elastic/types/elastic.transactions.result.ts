import { type ElasticQueryResult } from './elastic.query.result'

interface ElasticTransactionsSource {
  timestamp: number
  status: string
}

export type ElasticTransactionsResult = ElasticQueryResult<ElasticTransactionsSource>
