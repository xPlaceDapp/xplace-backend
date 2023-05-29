import { type ElasticQueryResult } from './elastic.query.result'

interface ElasticLogsSource {
  events: ElasticLogsEvent[]
}

interface ElasticLogsEvent {
  identifier: string
  topics: string[]
  data: string
}

export type ElasticLogsResult = ElasticQueryResult<ElasticLogsSource>
