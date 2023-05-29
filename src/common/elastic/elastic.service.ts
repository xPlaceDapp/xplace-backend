import { Injectable } from '@nestjs/common'
import { ApiConfigService } from '../api-config/api.config.service'
import axios from 'axios'
import { type ElasticTransactionsResult } from './types/elastic.transactions.result'
import { type ElasticLogsResult } from './types/elastic.logs.result'

@Injectable()
export class ElasticService {
  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {}

  async queryTransactions(body: any): Promise<ElasticTransactionsResult> {
    const url = `${this.apiConfigService.getElasticUrl()}/transactions/_search`

    return (await axios.post(url, body)).data
  }

  async queryLogs(body: any): Promise<ElasticLogsResult> {
    const url = `${this.apiConfigService.getElasticUrl()}/logs/_search`

    return (await axios.post(url, body)).data
  }
}
