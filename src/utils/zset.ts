// wrapper for redis zset

import { promisify } from 'util'
import { RedisClient } from 'redis'
import { REDIS_ZSET_NAME, redisClient  } from '../config/redis'
class ZSet{


    private zset_name: string = REDIS_ZSET_NAME
    private redis_client: RedisClient = redisClient

    public zadd: (score: number, userID: string) => Promise<any> = promisify(this.redis_client.zadd.bind(this.redis_client,this.zset_name))
    public zrange: (start: number, emd: number) => Promise<string[]> = promisify(this.redis_client.zrange.bind(this.redis_client,this.zset_name))
    public zrevrank: (userID: string) => Promise<any> = promisify(this.redis_client.zrevrank.bind(this.redis_client,this.zset_name))
    public zscore: (userID: string) => Promise<any> = promisify(this.redis_client.zscore.bind(this.redis_client,this.zset_name))
    public del: () => Promise<any> = promisify(this.redis_client.del.bind(this.redis_client,this.zset_name))
}

export default new ZSet()